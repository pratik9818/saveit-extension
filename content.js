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
  const rects = range.getClientRects();
  const lastRect = rects[rects.length - 1];
  const activeElement = document.activeElement;
  const isInputElement = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
  
  // Get correct coordinates based on element type
  let left, top;
  if (isInputElement) {
    const inputRect = activeElement.getBoundingClientRect();
    left = inputRect.right 
    top = inputRect.top
  } else {
    left = lastRect.left + window.scrollX + 5; // Add margin
    top = lastRect.top + window.scrollY - 40;   
  }
  saveButton = document.createElement("button");
  saveButton.id = "save-button";
  saveButton.textContent = "Save it";
  saveButton.style.position = "absolute";
  saveButton.style.left = `${left}px`;
  saveButton.style.top = `${top}px`;
  saveButton.style.zIndex = "1000";
  saveButton.style.background = "#55DD33";
  saveButton.style.color = "white";
  saveButton.style.border = "none";
  saveButton.style.padding = "2px 5px";
  saveButton.style.borderRadius = "5px";
  saveButton.style.cursor = "pointer";
  saveButton.style.fontFamily = "Arial, sans-serif";
  saveButton.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.3)";


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