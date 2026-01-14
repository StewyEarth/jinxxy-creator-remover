const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
let currenciesList = {};
let lastupdateCheck = null;


browserAPI.runtime.onInstalled.addListener(() => {
    InitJinxxyCompanion();
});

browserAPI.runtime.onStartup.addListener(() => {
    InitJinxxyCompanion();
});

function InitJinxxyCompanion() {
    storage.local.get("lastupdateCheck").then((result) => {
        if (result.lastupdateCheck) {
            lastupdateCheck = result.lastupdateCheck;
            lastupdateCheck = new Date(lastupdateCheck);
            console.log("Last update check:", lastupdateCheck);
            updateCurrencies();
        }else{
            updateCurrencies();
        }
    });
    storage.local.get("currencies").then((result) => {
        if (result.currencies) {
            currenciesList = result.currencies;
        } else {
            loadCurrencies();
        }
    });
}


// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in background script:", request);
    if (request.action === "getCurrencies") {
        sendResponse({ currencies: currenciesList });
    }
    if (request.action === "updateCurrencies") {
        updateCurrencies();
        sendResponse({ currencies: currenciesList });
    }
});


function loadCurrencies() {
    fetch(browserAPI.runtime.getURL('/json/currencies.json'))
        .then(response => response.json())
        .then(data => {
            currenciesList = data;
            storage.local.set({ currencies: data });
        }, error => {
            console.error("Error loading currencies.json:", error);
        });
}
function subtractHours(date, hours) {
    date.setHours(date.getHours() - hours);
    return date;
}
function addHours(date, hours) {
    date.setHours(date.getHours() + hours);
    return date;
}


function updateCurrencies() {
    let date = new Date(Date.now());
    let todaysDate = date.toLocaleDateString();
    let lastCheckDate = null;
    let lastCheckDateString = "";
    // Check last update time and if within 12 hours, skip update
    if (lastupdateCheck != null) {
        lastCheckDate = new Date(lastupdateCheck);
        lastCheckDateString = lastCheckDate.toLocaleDateString();
        if (lastCheckDateString == todaysDate) {
            console.log("Currency rates are up to date for today, skipping update.");
            console.log("next allowed update time:", addHours(lastCheckDate, 12));
            return;
        }
        if (subtractHours(date, 12) < lastCheckDate) {
            console.log("Last update was within 12 hours, skipping update.");
            return;
        }
    }
    
    fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json').then(response => response.json()).then(data => {
        if (data && data.usd && data.date) {

            console.log("Currency data fetched:", data);
            if ((data.date == currenciesList.latestUpdate) && (data.date == lastCheckDateString)) {
                return { "status": "No Update Needed" };
            }
            console.log(data);
            // Update local currency rates
            for (let dataKey in data.usd) {
                for (let curKey in currenciesList.currencies) {
                    if (dataKey == currenciesList.currencies[curKey].code) {
                        currenciesList.currencies[curKey].rate = data.usd[dataKey];
                    }
                }
            }
            console.log("Updated currenciesList:", currenciesList);
            // Update last update date
            currenciesList.latestUpdate = todaysDate;
            storage.local.set({ lastupdateCheck: date.toJSON() });
            lastupdateCheck = date.toJSON();
            storage.local.set({ currencies: currenciesList });
            return { "status": "Updated" };
        }
    }).catch((error) => {
        return { "status": "Error" };
    });
}