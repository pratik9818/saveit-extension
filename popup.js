document.getElementById("login").addEventListener("click", () => {
  chrome.storage.local.get(['extension_user_login'], (result) => {
  if (!result.extension_user_login ) {
    chrome.runtime.sendMessage({ type: "LOGIN" }, (response) => {
      if(response?.status){
        chrome.storage.local.set({ extension_user_login: true });
        window.close();
      }
    });
    }
  })
   
  });
  chrome.storage.local.get(['activeCapsule', 'capsules','activeCapsuleData'], (result) => {
    if (result.activeCapsule && result.capsules) {
      const activeCapsule = result.capsules.find(c => c.capsule_id === result.activeCapsule);
      if (activeCapsule) {
        document.getElementById('activeCapsule').textContent = 
          `Active Capsule: ${activeCapsule.capsule_name}`;
      }
     if(result.activeCapsuleData){
      const activeCapsule = result.activeCapsuleData[0];
      if (activeCapsule) {
        document.getElementById('activeCapsule').textContent =
          `Active Capsule: ${activeCapsule.capsule_name}`;
      }
     }
    }
  });
  chrome.storage.local.get(['extension_user_login'], (result) => {
    if(result.extension_user_login){
      document.getElementById("login").innerText = "Logout";
      document.getElementById("login").addEventListener("click", () => {
        // remove all storage
        // remove cookie
        // call logout api
        // need to set the condiion of extension_user_login for notify user to login if not when saveing fragment or searching capsule
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            console.error("Error clearing storage:", chrome.runtime.lastError);
          } else {
            console.log("All local storage cleared.");
          }
        });
        chrome.cookies.remove({
          url: 'http://localhost:3001',
          name: 'accessToken'
        });
        chrome.storage.local.set({ extension_user_login: false });
        document.getElementById("login").innerText = "Login";
    
        // Close popup
        window.close();
      });

    }else{
      document.getElementById("login").innerText = "Login";
    }
  })