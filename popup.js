document.getElementById("login").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "LOGIN" }, (response) => {
      console.log(response?.status || "No response");
    });
  });
  