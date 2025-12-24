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
    browser.storage.local.get("creators").then((result) => {
        if (result.creators) {
            hiddenCreators = result.creators;
            hiddenCreators.forEach((creator) => {
                addCreatorsToList(creator);
            });
        }else{
            browser.storage.local.set({ creators: [] });
        }
    });
}


saveButton.addEventListener("click", () => {
    let newCreators = creatorInput.value.split(",").map(name => name.trim()).filter(name => name !== "");
   if (newCreators.length !== 0) {
       newCreators.forEach((creator) => {
         addCreatorsToList(creator);
       });
         UpdateStorage();
         creatorInput.value = "";
   } 
});

resetButton.addEventListener("click", () => {
    hiddenCreators = [];
    creatorList.innerHTML = "";
    UpdateStorage();
});


function UpdateStorage() {
    browser.storage.local.set({ creators: hiddenCreators }).then(() => {
        statusText.textContent = "Creators updated!";
        setTimeout(() => {
            statusText.textContent = "";
        }, 2000);
    }, onError);
}

function addCreatorsToList(creator) {
    let divElement = document.createElement("div");
    divElement.classList.add("creator-entry");
    let removeButton = document.createElement("button");
    removeButton.classList.add("remove-button");
    removeButton.textContent = "X";
    let listItem = document.createElement("li");
    listItem.classList.add("creator-item");
    listItem.textContent = creator;
    listItem.appendChild(divElement);
    creatorList.appendChild(listItem);
    hiddenCreators.push(creator);
}