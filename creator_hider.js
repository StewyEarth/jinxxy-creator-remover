const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
let hiddenCreators = [];
let sortByLatest = false;
let hidePromoted = false;
let hiddenCreatorPosts = [];
let hiddenPromotedPosts = [];
let currenciesList = {};
let selectedCurrency = "usd";

InitJinxxyCompanion();

function InitJinxxyCompanion() {
  storage.local.get("creators").then((result) => {
    if (result.creators) {
      // Normalize all creator names to lowercase for comparison
      hiddenCreators = result.creators.map(name => name.toLowerCase());
      HideCreator(hiddenCreators);
    } else {
      storage.local.set({ creators: [] });
    }
  });
  storage.local.get("sortByLatest").then((result) => {
    if (result.sortByLatest !== undefined) {
      sortByLatest = result.sortByLatest;
    } else {
      storage.local.set({ sortByLatest: false });
    }
    fixLinkSorting();
  });
  storage.local.get("hidePromoted").then((result) => {
    if (result.hidePromoted !== undefined) {
      hidePromoted = result.hidePromoted;
    } else {
      storage.local.set({ hidePromoted: false });
    }
  });
  storage.local.get("currencies").then((result) => {
    if (result.currencies) {
      currenciesList = result.currencies;
    } else {
      console.log("No currencies found in storage.");
    }
  });

  function popUpHandler(request, sender, sendResponse) {
    if (request.action === "updateCreators") {
      storage.local.get("creators").then((result) => {
        if (result.creators) {
          hiddenCreators = result.creators.map(name => name.toLowerCase());
          HideCreator(hiddenCreators);
        }
      });
    }
    if (request.action === "toggleSortByLatest") {
      sortByLatest = request.value;
      storage.local.set({ sortByLatest: sortByLatest });
      fixLinkSorting();
    }
    if (request.action === "toggleHidePromoted") {
      hidePromoted = request.value;
      storage.local.set({ hidePromoted: hidePromoted });
      HidePromotedListings();
    }
    if (request.action === "UpdateCurrency") {
      selectedCurrency = request.value;
      storage.local.set({ selectedCurrency: selectedCurrency });
      updateListingsPrice();
    }
  }

  // if (typeof browser !== "undefined" && browser.runtime && browser.runtime.onMessage) {
  //   browserAPI.runtime.onMessage.addListener(popUpHandler);
  // } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  //   chrome.runtime.onMessage.addListener(popUpHandler);
  // }
    // Listen for messages from the popup
  if (typeof browserAPI !== "undefined" && browserAPI.runtime && browserAPI.runtime.onMessage) {
    browserAPI.runtime.onMessage.addListener(popUpHandler);
  }
}

// Adjust page URLs to include sort=latest if needed
function fixLinkSorting() {
  let links = document.querySelectorAll("a");
  links.forEach(link => {
    if (link.href.includes("market") && !link.href.includes("sort") && !link.href.includes("page")) {
      if (sortByLatest) {
        if (!link.href.includes("sort=latest")) {
          if (link.href.includes("?")) {
            link.href = link.href + "&sort=latest";
          } else {
            link.href = link.href + "?sort=latest";
          }
          link.classList.add("updatedLinkLocation");
        }
      }
    }
  });
};

document.addEventListener('click', function (e) {
  let link = e.target.closest('a.updatedLinkLocation');
  if (link) {
    e.stopImmediatePropagation();
    e.preventDefault();
    window.location.href = link.href;
  }
}, true);

function HidePromotedListings() {
  let listings = document.querySelectorAll(".rounded-lg"); // Replace with actual class
  if (hidePromoted) {
    listings.forEach(listing => {
      if (listing != null) {
        if (listing.querySelector('[aria-label="Promoted Product"]')) {
          listing.classList.add("hidden");
          hiddenPromotedPosts.push(listing);
        }
      }
    });
  } else if (!hidePromoted && hiddenPromotedPosts.length != 0) {
    hiddenPromotedPosts.forEach(listing => {
      listing.classList.remove("hidden");
    });
    hiddenPromotedPosts = [];
  }
}

function updateListingsPrice(){
  if(document.location.href.includes("market")) {
      let listings = document.querySelectorAll("#mgRudj .rounded-lg");
      listings.forEach((listing) => {
        if (listing != null){
          let price = listing.querySelector('span.ml-auto.font-semibold');
          if (price != null){
            let priceText = price.textContent.trim();
            if (priceText.includes(",")){
              priceText = priceText.replace(",", "."); // Handle European decimal format
            }
            let currencycode = priceText.match(/\b[a-z]+\b/gi)[0].toLowerCase();
            let amount = parseFloat(priceText.match(/\b[\d\.]+\b/g)[0])
            if (currencycode != selectedCurrency){
              let convertedAmount = convertCurrency(amount, currencycode);
              if (convertedAmount != null){
                price.textContent = `Est: ${convertedAmount.toFixed(2)} ${selectedCurrency.toUpperCase()} (was ${priceText})`;
              }
            }
          }
        };
      });
  }
}

function convertCurrency(amount, fromCurrency) {
  for (let currencyKey in currenciesList.currencies) {
    if (currenciesList.currencies[currencyKey].code === fromCurrency) {
      console.log("Found matching currency:", currenciesList.currencies[currencyKey]);
      let rate = currenciesList.currencies[currencyKey].rate;
      console.log(rate);
      let convertedAmount = amount / rate;
      return convertedAmount;
    }
  }
}

function HideCreator(creatorNames) {
  // Hide creators in New Arrivals section
  let NewArrivals = document.querySelector('.py-12');
  if (NewArrivals != null) {
    let newArrivalsListings = NewArrivals.querySelectorAll(".rounded-lg");
    newArrivalsListings.forEach(listing => {
      let listingLink = listing.querySelector("a");
      if (listingLink != null) {
        let href = listingLink.href.toLowerCase();
        if (creatorNames.some(creatorName => href.includes(creatorName))) {
          listing.classList.add("hidden");
        }
      }
    });
  }

  // Hide creators in carousel
  let carousel = document.querySelector('[aria-roledescription="carousel"]');
  if (carousel != null) {
    let carouselListings = carousel.querySelectorAll(".rounded-lg");
    carouselListings.forEach(listing => {
      let listingLink = listing.querySelector("a");
      if (listingLink != null) {
        let href = listingLink.href.toLowerCase();
        if (creatorNames.some(creatorName => href.includes(creatorName))) {
          listing.classList.add("hidden");
        }
      }
    });
  }
  // Hide creators in main listings
  let listings = document.querySelectorAll(".text-card-foreground");
  listings.forEach((listing) => {
    if (listing != null) {
      let userSpan = listing.querySelector(".decoration-2 span");
      if (userSpan != null) {
        let user = userSpan.textContent.toLowerCase();
        if (creatorNames.includes(user)) {
          listing.classList.add("hidden");
        }
      }
    }
  })
};

const observer = new MutationObserver(() => {
  HideCreator(hiddenCreators);
  HidePromotedListings();
  fixLinkSorting();
  updateListingsPrice();
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
});