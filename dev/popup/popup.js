const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
const creatorInput = document.getElementById("creatorsToHide");
const saveButton = document.getElementById("saveButton");
const statusText = document.getElementById("statusText");
const creatorList = document.getElementById("creatorList");
const resetButton = document.getElementById("resetButton");
const creatorlistTitle = document.getElementById("creatorlistTitle");
const sortByLatestCheckbox = document.getElementById("sortByLatestCheckbox");
const hidePromotedCheckbox = document.getElementById("hidePromotedCheckbox");
const optionsList = document.getElementById("optionsList");
const currencySelect = document.getElementById("currencyselect");
const infoPopupCurrencyLastUpdate = document.getElementById("infoPopupCurrencyLastUpdate");
let lastupdateCheck = null;
let hiddenCreators = [];
let sortByLatest = false;
let hidePromoted = false;
let currenciesList = {};
let selectedCurrency = "usd";

function onError(error) {
  console.log(error);
}

InitJinxxyCompanion();

function InitJinxxyCompanion() {
  storage.local.get("creators").then((result) => {
    if (result.creators) {
      hiddenCreators = result.creators;
      hiddenCreators.forEach((creator) => {
        addCreatorsToList(creator);
      });
    } else {
      storage.local.set({ creators: [] });
    }
  });
  storage.local.get("sortByLatest").then((result) => {
    if (result.sortByLatest !== undefined) {
      sortByLatestCheckbox.checked = result.sortByLatest;
    } else {
      sortByLatest = result.sortByLatest;
    }
  });

  storage.local.get("lastupdateCheck").then((result) => {
    if (result.lastupdateCheck) {
      lastupdateCheck = result.lastupdateCheck;
      lastupdateCheck = new Date(lastupdateCheck);
      let lastupdateString = lastupdateCheck.toLocaleString();
      lastupdateString = lastupdateString.replace(",", " -");
      lastupdateString = lastupdateString.replace(".", ":");
      infoPopupCurrencyLastUpdate.textContent = `${lastupdateString.slice(0, -3)}`;
    } else {
      // If no last update check found, fetch currencies to set it
      getCurrencies();
      // Update the last update check display once currencies are fetched
      let lastupdateString = lastupdateCheck.toLocaleString();
      lastupdateString = lastupdateString.replace(",", " -");
      lastupdateString = lastupdateString.replace(".", ":");
      infoPopupCurrencyLastUpdate.textContent = `${lastupdateString.slice(0, -3)}`;
    }
  });

  storage.local.get("hidePromoted").then((result) => {
    if (result.hidePromoted !== undefined) {
      hidePromotedCheckbox.checked = result.hidePromoted;
    } else {
      hidePromoted = result.hidePromoted;
    }
  });
  storage.local.get("selectedCurrency").then((result) => {
    if (result.selectedCurrency) {
      selectedCurrency = result.selectedCurrency;
    } else {
      storage.local.set({ selectedCurrency: "usd" });
    }
  });
  storage.local.get("currencies").then((result) => {
    if (result.currencies) {
      currenciesList = result.currencies;
    } else {
      getCurrencies();
    }
  }).then(() => {
    addCurrencyOptions();
  });
  const manifest = (typeof browser !== 'undefined' ? browser : chrome).runtime.getManifest();
  document.getElementById("infoPopupVersion").textContent = manifest.version;
}

function addCurrencyOptions() {
  if (currenciesList && currenciesList.currencies) {
    for (let currencies in currenciesList.currencies) {
      let option = document.createElement("option");
      option.value = `${currenciesList.currencies[currencies].code}`;
      option.textContent = `${currenciesList.currencies[currencies].code.toUpperCase()} - ${currenciesList.currencies[currencies].name}`;
      currencySelect.appendChild(option);
    }
    currencySelect.value = selectedCurrency;
  }
}

function queryTabs(queryInfo) {
  console.log("Querying tabs with:", queryInfo);
  if (browserAPI.tabs.query.length === 1) {
    // Firefox/WebExtension: returns Promise
    return browserAPI.tabs.query(queryInfo);
  } else {
    // Chrome: uses callback
    return new Promise((resolve) => {
      browserAPI.tabs.query(queryInfo, resolve);
    });
  }
}

function sendMessageToActiveTab(message) {
  queryTabs({ active: true, currentWindow: true }).then((tabs) => {
    let allowedHosts = ["jinxxy.com", "www.jinxxy.com"];
    let url = new URL(tabs[0].url);
    if (allowedHosts.includes(url.hostname)) {
      browserAPI.tabs.sendMessage(tabs[0].id, message);
    }
  });
}

currencySelect.addEventListener("change", () => {
  const newCurrency = currencySelect.value;
  const message = { action: "UpdateCurrency", value: currencySelect.value };
  storage.local.set({ selectedCurrency: newCurrency });
  sendMessageToActiveTab(message);
});

// Send message to content script to update hidden creators
function sendUpdateMessage() {
  const message = { action: "updateCreators" };
  sendMessageToActiveTab(message);
}

// Scroll to options on click
optionsList.addEventListener("click", () => {
  optionsList.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
});

// Event Listeners
sortByLatestCheckbox.addEventListener("change", () => {
  const message = { action: "toggleSortByLatest", value: sortByLatestCheckbox.checked };
  sendMessageToActiveTab(message);
  storage.local.set({ sortByLatest: sortByLatestCheckbox.checked });
});

hidePromotedCheckbox.addEventListener("change", () => {
  const message = { action: "toggleHidePromoted", value: hidePromotedCheckbox.checked };
  sendMessageToActiveTab(message);
  storage.local.set({ hidePromoted: hidePromotedCheckbox.checked });
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
  if (hiddenCreators.length > 0) {
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

function getCurrencies() {
  const message = { action: "getCurrencies" };
  browser.runtime.sendMessage(message).then((response) => {
    if (response && response.currencies) {
      currenciesList = response.currencies;
    }
  });
}