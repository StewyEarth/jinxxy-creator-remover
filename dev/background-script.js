const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
let currenciesList = {};
let lastupdateCheck = null;
let lastCheckDate = null;
let lastCheckDateString = "";
let todaysDate = undefined;


browserAPI.runtime.onInstalled.addListener(() => {
    InitJinxxyCompanion();
});

browserAPI.runtime.onStartup.addListener(() => {
    InitJinxxyCompanion();
});

async function InitJinxxyCompanion() {
    lastupdateCheck = await checkLocalStorage("lastupdateCheck");
    currenciesList = await checkLocalStorage("currencies");
    await loadCurrencies();
    // if (lastupdateCheck != null) {
    //     await updateCurrencies();
    // } else {
    //     await loadCurrencies();
    // }

    // if (currenciesList != null) {
    //     await loadCurrencies();
    //     return;
    // }
}

function checkLocalStorage(key) {
    return storage.local.get(key).then((result) => {
        if (result[key] === undefined) {
            return null;
        }
        return result[key];
    });
}

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "getCurrencies") {
        lastupdateCheck = await checkLocalStorage("lastupdateCheck");
        currenciesList = await checkLocalStorage("currencies");
        await loadCurrencies();
        sendResponse({ currencies: currenciesList });
    }
});


async function loadCurrencies() {
    await fetch(browserAPI.runtime.getURL('/json/currencies.json'))
        .then(response => response.json())
        .then(async data => {
            if (data == null || data.latestUpdate == null || data.currencies == null) {
                console.error("No data found in currencies.json");
                return;
            }
            if (currenciesList == null) {
                currenciesList = data;
                storage.local.set({ currencies: data });
                await updateCurrencies();
                return;
            }
            if (new Date(data.latestUpdate) > new Date(currenciesList.latestUpdate)) {
                currenciesList = data;
                storage.local.set({ currencies: data });
            }
            await updateCurrencies();
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


async function updateCurrencies() {
    let date = new Date(Date.now());
    todaysDate = date.toLocaleDateString();
    console.log("Trying to update currency, last check: ", lastupdateCheck)

    // Check last update time and if within 12 hours, skip update
    if (lastupdateCheck != null) {
        lastCheckDate = new Date(lastupdateCheck);
        lastCheckDateString = lastCheckDate.toLocaleDateString();
        if (lastCheckDateString == todaysDate) {
            console.log("Currency rates are up to date for today, skipping update. next available update time:", addHours(lastCheckDate, 12),"or later");
            return;
        }
        if (subtractHours(date, 12) < lastCheckDate) {
            console.log("Last update was within 12 hours, skipping update.");
            return;
        }
    }

    fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json').then(response => response.json()).then(async data => {
        if (data && data.usd && data.date) {
            if ((data.date == currenciesList.latestUpdate) && (data.date == lastCheckDateString)) {
                return { "status": "No Update Needed" };
            }
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