console.log("Content script loaded");

// Track selection state
let isTextSelected = false;
let saveButton = null;

// Handle text selection changes
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText) {
    if (!isTextSelected) {
      createSaveButton(selection);
      isTextSelected = true;
    }
  } else {
    removeSaveButton();
    isTextSelected = false;
  }
});

function createSaveButton(selection) {
  // Remove existing button if any
  removeSaveButton();
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  saveButton = document.createElement("button");
  saveButton.id = "save-button";
  saveButton.textContent = "Save";
  saveButton.style.position = "absolute";
  saveButton.style.left = `${rect.left + window.scrollX}px`;
  saveButton.style.top = `${rect.bottom + window.scrollY + 12}px`;
  saveButton.style.zIndex = "1000";
  saveButton.style.background = "blue";
  saveButton.style.color = "white";
  saveButton.style.border = "none";
  saveButton.style.padding = "5px 10px";
  saveButton.style.borderRadius = "5px";
  saveButton.style.cursor = "pointer";

  document.body.appendChild(saveButton);
  
  saveButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "saveText",
      data: {
        textContent: selection.toString().trim(),
      },
    });
    removeSaveButton();
  });
}

function removeSaveButton() {
  if (saveButton) {
    saveButton.remove();
    saveButton = null;
  }
}