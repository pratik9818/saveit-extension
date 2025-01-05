console.log("Content script loaded");
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Remove any existing Save button
 
  // If text is selected, show the Save button
  if (selectedText) {
    

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create the Save button
    const saveButton = document.createElement("button");
    saveButton.id = "save-button";
    saveButton.textContent = "Save";
    saveButton.style.position = "absolute";
    saveButton.style.left = `${rect.left + window.scrollX}px`;
    saveButton.style.top = `${rect.bottom + window.scrollY + 5}px`;
    saveButton.style.zIndex = "1000";
    saveButton.style.background = "blue";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.padding = "5px 10px";
    saveButton.style.borderRadius = "5px";
    saveButton.style.cursor = "pointer";

    // Append the button to the body
    document.body.appendChild(saveButton);
    
    // Handle Save button click
    saveButton.addEventListener("click", () => {

console.log(selectedText);

      // Send the selected text to the background script
      chrome.runtime.sendMessage({
        action: "saveText",
        data: {
          textContent: selectedText,
        },
      });
      saveButton.remove();
      
      // Cleanup: Remove the Save button after sending the message
      const existingButton = document.getElementById("save-button");
      if (existingButton) existingButton.remove();

    });
  }
});
