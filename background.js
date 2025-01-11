const domain = 'http://localhost:3001/api/v1'
let capsules = []

// chrome.runtime.onConnect.addListener((port) => {
//   console.log("Connected to content script");

//   port.onMessage.addListener((message) => {
//     console.log("Received message:", message);
//     if (message.text) {
//       console.log("Captured text:", message.text);
//     }
//   });
// });

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

  if (message.action === "saveText") {
    const { textContent } = message.data;
    saveTextFragment(textContent)
    // Return true to indicate an async response
    return true;
  }
});

// Create the context menu when the extension is installed
chrome.contextMenus.create({
  id: 'selectFolder', // Unique ID for the menu item
  title: "Select Capsule to Save Text",
  contexts: ["all"], // Available when right-clicking anywhere
});

// Listen for clicks on the context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'selectFolder') {
    capsules = []
    capsules = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['capsules'], async (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (result.capsules && result.capsules.length > 0) {
          resolve(result.capsules);
        } else {
          await getCapsules();
          chrome.storage.local.set({ capsules }, () => {
            console.log('Capsules saved in storage:', capsules);
          });
          resolve(capsules);
        }
      });
    });


    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showFolderSelectionModal,
      args: [capsules]
    });
  }
});

async function showFolderSelectionModal(capsules) {
  let activeCapsule = await new Promise((resolve, reject) => {
    chrome.storage.local.get(['activeCapsule'], async (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (result.activeCapsule) {
        resolve(result.activeCapsule);
      }
    });
  });
  
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.zIndex = "9999";
  if (!capsules || capsules.length === 0) {
    modal.innerHTML = `
        <h3>No Folders Available</h3>
        <p>Please create a folder via website before proceeding.</p>
      `;
  }
  else {
    
    modal.innerHTML = `
  <h3 style='font-family:Arial, Helvetica, sans-serif; margin:7px; font-weight:bold;'>Select a Capsule</h3>
  <input type="text" id="saveit-folderSearch" placeholder="Search Capsules Name" style="padding:5px; margin:4px; width:'100%';" />
  <ul id="saveit-folderList" style="height:40vh; overflow-y:auto; width:20vw;">
    ${capsules.map(capsule => {
      const isActive = capsule.capsule_id === activeCapsule;
      return `<li>
        <button 
          data-id="${capsule.capsule_id}" 
          class="folder-button" 
          style="padding: 5px; margin: 5px; cursor:pointer; font-size:1rem; 
          ${isActive ? 'border: 2px solid #007bff; border-radius: 4px;' : 'border:none;'}"
        >
          ${capsule.capsule_name.substring(0, 20)}
        </button>
      </li>`;
    }).join('')}
  </ul>`;
  }

  document.body.appendChild(modal);

  const folderSearch = document.getElementById("saveit-folderSearch");
  const folderList = document.getElementById("saveit-folderList");

  // In showFolderSelectionModal function
  folderSearch.addEventListener("input", async (e) => {
    const searchValueState = e.target.value.toLowerCase();
    if (!searchValueState) {
      chrome.storage.local.get(['capsules'], async (result) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else if (result.capsules && result.capsules.length > 0) {
          if(!result.capsules.length){
            folderList.innerHTML = `<li>No Capsules Found</li>`;
            return;
          }
          result.capsules.map(capsule => {
            const isActive = capsule.capsule_id === activeCapsule;
            return `<li>
              <button 
                data-id="${capsule.capsule_id}" 
                class="folder-button" 
                style="padding: 5px; margin: 5px; cursor:pointer; font-size:1rem; 
                ${isActive ? 'border: 2px solid #007bff; border-radius: 4px;' : 'border:none;'}"
              >
                ${capsule.capsule_name.substring(0, 20)}
              </button>
            </li>`;
          }).join('')
          return;
        }
      })
    }
    // Execute search directly in the background script
    const port = chrome.runtime.connect({ name: "search-connection" });

    port.postMessage({
      type: "SEARCH_CAPSULES",
      searchValue: searchValueState
    });

    port.onMessage.addListener((response) => {

      if (response && response.data.data && searchValueState.length) {
       
        folderList.innerHTML = response.data.data.map(capsule => {
          const isActive = capsule.capsule_id === activeCapsule;
          return `<li>
            <button 
              data-id="${capsule.capsule_id}" 
              class="folder-button" 
              style="padding: 5px; margin: 5px; cursor:pointer; font-size:1rem; 
              ${isActive ? 'border: 2px solid #007bff; border-radius: 4px;' : 'border:none;'}"
            >
              ${capsule.capsule_name.substring(0, 20)}
            </button>
          </li>`;
        }).join('')

        document.querySelectorAll(".folder-button").forEach(button => {
          button.addEventListener("click", function () {
            const capsuleId = this.getAttribute("data-id");
            chrome.storage.local.set({ activeCapsule: capsuleId });

            chrome.storage.local.set({ activeCapsuleData: response.data.data.filter(c => c.capsule_id == capsuleId) });
            modal.remove();
          });
        });
      }
      else{
       if(searchValueState.length) folderList.innerHTML = `<li>No Capsules Found</li>`;
        return;
      }
    });
  });


  const closeModal = (event) => {
    if (!modal.contains(event.target)) {
      modal.remove();
      document.removeEventListener('click', closeModal); // Remove the event listener after closing the modal
    }
  };
  document.addEventListener('click', closeModal);

  if (capsules && capsules.length > 0) {
    document.querySelectorAll(".folder-button").forEach(button => {
      button.addEventListener("click", function () {
        const capsuleId = this.getAttribute("data-id");
        const activeCapsule = capsuleId;
        chrome.storage.local.set({ activeCapsule }, () => {
          console.log("Selected capsule saved in storage:", activeCapsule);
          document.removeEventListener('click', closeModal);
        });
        
        chrome.storage.local.set({ activeCapsuleData: capsules.filter(c => c.capsule_id == activeCapsule) });

        modal.remove(); // Close the modal after selection
      });
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and ready.");
});

// Function to handle Google OAuth2 login
async function handleGoogleAuth() {
  const oauth2Url = "https://accounts.google.com/o/oauth2/auth";
  const { oauth2 } = chrome.runtime.getManifest();

  const authUrl = `${oauth2Url}?client_id=${oauth2.client_id}&response_type=id_token&redirect_uri=${chrome.identity.getRedirectURL()}&scope=${oauth2.scopes.join(" ")}`;

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error("Auth failed:", chrome.runtime.lastError?.message);
        return;
      }

      const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
      const idToken = urlParams.get("id_token");

      if (idToken) {
        login(idToken);  // Send this ID token to your backend

      } else {
        console.error("Failed to retrieve ID token.");
      }
    }
  );
}


async function login(accessToken) {
  try {
    await fetch(`${domain}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: accessToken, client: 'extension' }), // Send the token as JSON
    })
      .then((res) => res.json()) // Parse the JSON response
      .then((data) => {
        const { token } = data
        // chrome.storage.local.set({ 'token': token }, () => {
        //   console.log('Token stored');
        // });
        setAuthTokenCookie(token)

      })
      .catch((error) => {
        console.error('Error during authentication:', error);
      });


  } catch (error) {
    console.log(error);

  }
}
// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOGIN") {
    handleGoogleAuth();
    sendResponse({ status: true }); //could be bug because i am not making sure everything run good in handleGoogleAuth
  }
});

async function getCapsules() {
  const dateModified = new Date().toUTCString();
  const res = await fetch(`${domain}/capsules?dateModified=${dateModified}`, {
    credentials: "include"
  })

  const result = await res.json()
  capsules = result.data
}
function setAuthTokenCookie(token) {
  console.log('Attempting to set cookie with token:', token);
  chrome.cookies.set(
    {
      url: 'http://localhost:3001',
      name: 'accessToken',
      value: token,
      secure: true,
      sameSite: 'lax',
    },
    (cookie) => {
      if (chrome.runtime.lastError) {
        console.error('Error setting cookie:', chrome.runtime.lastError.message);
      } else if (cookie) {
        console.log('Cookie set successfully:', cookie);
        getCapsules()
      } else {
        console.error('Unexpected issue: Cookie could not be set.');
      }
    }
  );
}
async function saveTextFragment(text) {
  const { activeCapsule } = await new Promise((resolve, reject) => {
    chrome.storage.local.get(['activeCapsule'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });

  if (!activeCapsule) {
    console.error("Error: activeCapsule is not set.");
    return;
  }
  try {
    const res = await fetch(`${domain}/fragments/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        capsuleId: activeCapsule,
        tag: "",
        textContent: text
      }),
      credentials: "include"
    })
    const result = await res.json()
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}

// In background script
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (message) => {
    if (message.type === "SEARCH_CAPSULES") {
      const res = await fetch(`${domain}/capsules/search?searchValue=${message.searchValue}`, {
        credentials: 'include'
      });
      const data = await res.json();
      port.postMessage({ data });
    }
  });
});