const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
let creatorInput = document.getElementById("creatorsToHide");
let saveButton = document.getElementById("saveButton");
let statusText = document.getElementById("statusText");
let creatorList = document.getElementById("creatorList");
let resetButton = document.getElementById("resetButton");
let hiddenCreators = [];

function onError(error) {
  console.log(error);
}

InitHiddenCreators();

function InitHiddenCreators(){
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
}


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
});


function UpdateStorage() {
    storage.local.set({ creators: hiddenCreators }).then(() => {
        statusText.textContent = "Creators updated!";
        setTimeout(() => {
            statusText.textContent = "";
        }, 2000);
    }, onError);
}

function addCreatorsToList(creator) {
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