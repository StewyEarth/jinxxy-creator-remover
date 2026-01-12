const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
let currenciesList = {};
let lastupdateCheckHour = null;


browser.runtime.onInstalled.addListener(() => {
    InitJinxxyCompanion();
});

browser.runtime.onStartup.addListener(() => {
    InitJinxxyCompanion();
});

function InitJinxxyCompanion() {
    storage.local.get("currencies").then((result) => {
        if (result.currencies) {
            currenciesList = result.currencies;
        } else {
            loadCurrencies();
        }
    }).then(() => {
        updateCurrencies();
    }).catch((error) => {
        console.error("Error initializing currencies:", error);
    });
}


// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCurrencies") {
        sendResponse({ currencies: currenciesList });
    }
    if (request.action === "updateCurrencies") {
        updateCurrencies();
        sendResponse({ currencies: currenciesList });
    }
});



function loadCurrencies() {
    fetch(browser.runtime.getURL('/json/currencies.json'))
        .then(response => response.json())
        .then(data => {
            currenciesList = data;
            storage.local.set({ currencies: data });
            console.log(currenciesList);
        }, error => {
            console.error("Error loading currencies.json:", error);
        });
}


function updateCurrencies() {
    // Check if we need to update currencies (once every 12 hours)
    if (lastupdateCheckHour == null || new Date(Date.now()).getUTCHours() < 12 && lastupdateCheckHour >= 12 || new Date(Date.now()).getUTCHours() >= 12 && lastupdateCheckHour < 12 || currenciesList == {}) {
        console.log(lastupdateCheckHour)
        fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json').then(response => response.json()).then(data => {
            if (data && data.usd && data.date != currenciesList.latestUpdate) {
                // Update local currency rates
                for (let dataKey in data.usd) {
                    for (let curKey in currenciesList.currencies) {
                        if (dataKey == currenciesList.currencies[curKey].code) {
                            currenciesList.currencies[curKey].rate = data.usd[dataKey];
                            console.log(`Updated ${currenciesList.currencies[curKey].code} rate to ${data.usd[dataKey]}`);
                        }
                    }
                }
                // Save the last updated date
                currenciesList.latestUpdate = data.date;
                // Save updated currencies to local storage
                storage.local.set({ currencies: currenciesList });
                console.log("Currencies updated from API:", currenciesList);
                lastupdateCheckHour = new Date(Date.now()).getUTCHours();
                console.log(lastupdateCheckHour)
                return { "status": "Updated" };
            }
        }).catch((error) => {
            return { "status": "Error" };
        });
    }
}