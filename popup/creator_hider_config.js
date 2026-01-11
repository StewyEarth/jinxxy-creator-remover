const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const creatorInput = document.getElementById("creatorsToHide");
const saveButton = document.getElementById("saveButton");
const statusText = document.getElementById("statusText");
const creatorList = document.getElementById("creatorList");
const resetButton = document.getElementById("resetButton");
const creatorlistTitle = document.getElementById("creatorlistTitle");
const sortByLatestCheckbox = document.getElementById("sortByLatestCheckbox");
const hidePromotedCheckbox = document.getElementById("hidePromotedCheckbox");
const optionsList = document.getElementById("optionsList");
let hiddenCreators = [];
let sortByLatest = false;
let hidePromoted = false;

function onError(error) {
  console.log(error);
}

InitJinxxyCompanion();

function InitJinxxyCompanion(){
    storage.local.get("creators").then((result) => {
        if (result.creators) {
            hiddenCreators = result.creators;
            hiddenCreators.forEach((creator) => {
                addCreatorsToList(creator);
            });
        }else{
            storage.local.set({ creators: [] });
        }
    });
    storage.local.get("sortByLatest").then((result) => {
      if (result.sortByLatest !== undefined) {
        sortByLatestCheckbox.checked = result.sortByLatest;
      }else{
        sortByLatest = result.sortByLatest;
      }
    });
    storage.local.get("hidePromoted").then((result) => {
      if (result.hidePromoted !== undefined) {
        hidePromotedCheckbox.checked = result.hidePromoted;
      }else{
        hidePromoted = result.hidePromoted;
      }
    });
}

// Send message to content script to update hidden creators
function sendUpdateMessage() {
  const message = { action: "updateCreators" };
  if (typeof browser !== "undefined" && browser.tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      if (tabs[0].url.includes("jinxxy.com")){
        browser.tabs.sendMessage(tabs[0].id, message);
      }
    });
  } else if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0].url.includes("jinxxy.com")){
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
}

// Scroll to options on click
optionsList.addEventListener("click", () => {
  optionsList.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
});

// Event Listeners
sortByLatestCheckbox.addEventListener("change", () => {
  const message = { action: "toggleSortByLatest", value: sortByLatestCheckbox.checked };
  if (typeof browser !== "undefined" && browser.tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      if (tabs[0].url.includes("jinxxy.com")){
        browser.tabs.sendMessage(tabs[0].id, message);
      }
    });
  } else if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0].url.includes("jinxxy.com")){
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});

hidePromotedCheckbox.addEventListener("change", () => {
  const message = { action: "toggleHidePromoted", value: hidePromotedCheckbox.checked };
  if (typeof browser !== "undefined" && browser.tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      if (tabs[0].url.includes("jinxxy.com")){
        browser.tabs.sendMessage(tabs[0].id, message);
      }
    });
  } else if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0].url.includes("jinxxy.com")){
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});

creatorInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveButton.click();
  }
});

saveButton.addEventListener("click", () => {
    let newCreators = creatorInput.value.split(",").map(name => name.trim()).filter(name => name !== "");
    let added = false;
    newCreators.forEach((creator) => {
        if (!hiddenCreators.includes(creator)) {
            hiddenCreators.push(creator);
            addCreatorsToList(creator);
            added = true;
        }
    });
    if (added) {
        UpdateStorage();
    }
    creatorInput.value = "";
});

resetButton.addEventListener("click", () => {
    hiddenCreators = [];
    creatorList.innerHTML = "";
    UpdateStorage();
    resetButton.classList.add("hidden");
    creatorlistTitle.classList.add("hidden");
    statusText.classList.add("hidden");
});


function UpdateStorage() {
    storage.local.set({ creators: hiddenCreators }).then(() => {
        statusText.classList.remove("hidden");
        statusText.textContent = "Creators updated!";
        sendUpdateMessage();
        setTimeout(() => {
            statusText.classList.add("hidden");
        }, 1000);
    }, onError);
}

function addCreatorsToList(creator) {
      if (hiddenCreators.length > 0){
        creatorlistTitle.classList.remove("hidden");
        resetButton.classList.remove("hidden");
    }
    let divElement = document.createElement("div");
    let listItem = document.createElement("li");
    let removeButton = document.createElement("button");
    divElement.classList.add("creator-entry");
    
    //Remove Button
    removeButton.classList.add("remove-button");
    removeButton.textContent = "X";


    listItem.classList.add("creator-item");
    listItem.textContent = creator;
    listItem.appendChild(divElement);
    listItem.appendChild(removeButton);
    creatorList.appendChild(listItem);

    // Remove Creator functionality
    removeButton.addEventListener("click", () => {
        let creatorIndex = hiddenCreators.indexOf(creator);
        if (creatorIndex > -1) {
            hiddenCreators.splice(creatorIndex, 1);
            UpdateStorage();
            creatorList.removeChild(listItem);
        }
    });
    
}