const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
let hiddenCreators = [];
let sortByLatest = false;
let hidePromoted = false;
let hiddenCreatorPosts = [];
let hiddenPromotedPosts = [];
let currenciesList = {};
let selectedCurrency = "usd";
let priceupdateInterval = 1000;
let isUpdatingPrices = false;

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
  storage.local.get("selectedCurrency").then((result) => {
    if (result.selectedCurrency) {
      selectedCurrency = result.selectedCurrency;
    } else {
      storage.local.set({ selectedCurrency: "usd" });
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

function addTagSeachbox() {
  let filterSideBar = document.querySelector('div.space-y-8.pb-16')
  let filterOptions = filterSideBar.querySelectorAll('div');
  let url = new URL(window.location.href);
  let urlSearchedTags = url.searchParams.get("tags");
  if (urlSearchedTags) {
    urlSearchedTags = urlSearchedTags.split(",").map(name => name.trim()).filter(name => name !== "")
  }
  if (document.getElementById("tagSearchBox")) {
    return; // Tag search box already exists
  }
  // Find the Product Tags filter option and add a search box
  filterOptions.forEach(option => {
    option.childNodes.forEach(element => {
      if (element.textContent && element.textContent.toLowerCase().includes("product tags")) {
        let tagSearchBox = document.createElement("input");
        tagSearchBox.type = "text";
        tagSearchBox.id = "tagSearchBox";
        tagSearchBox.placeholder = "Search tags...";
        tagSearchBox.autocomplete = "off";
        tagSearchBox.style.marginBottom = "1em";
        tagSearchBox.className = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
        element.after(tagSearchBox);


        if (urlSearchedTags && urlSearchedTags.length > 0) {
          // Get tags from URL and display them in the tag section
          urlSearchedTags.forEach(tag => {
            console.log("Tag from URL:", tag);
            let newTagDiv = document.createElement("div");
            newTagDiv.textContent = tag;
            newTagDiv.className = "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20 cursor-pointer";
            let tagsection = tagSearchBox.nextSibling;
            let tagExists = false;
            tagsection.querySelectorAll("div").forEach(existingTag => {
              if (existingTag.textContent.toLowerCase() === tag) {
                existingTag.textContent = toTitleCase(tag);
                tagExists = true;
                newTagDiv.remove();
              }
            });
            if (tagsection.childNodes.length < 1) {
              if (!tagExists) {
                tagsection.prepend(newTagDiv);
              } else {
                tagsection.appendChild(newTagDiv);
              }
            }

          });
        }
        // Add event listener for Enter key to add tags
        tagSearchBox.addEventListener("keyup", (event) => {
          if (event.key === "Enter") {
            let searchTags = tagSearchBox.value.toLowerCase();
            if (urlSearchedTags == null) {
              urlSearchedTags = [];
            }
            let mergedTags = urlSearchedTags.concat(searchTags.split(",").map(name => name.trim()).filter(name => name !== ""));
            // Remove duplicate tags
            mergedTags = [...new Set(mergedTags)];
            url.searchParams.set("tags", mergedTags.join(","));
            window.location.href = url.href;
          }
        });
      }
    });
  });
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function fixBottomsLink() {
  let bottomsLink = document.querySelector(`a[href*="/clothing?type=bottoms"]`);
  if (bottomsLink) {
    let url = new URL(bottomsLink.href);
    url.searchParams.set('type', 'leggings,pants,shorts,skirt,bottom');
    bottomsLink.href = url;
  };
}

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
  };
};

async function updateListingsPrice() {
  if (document.location.href.includes("market")) {
    let listings = document.querySelectorAll("#mgRudj .rounded-lg");
    listings.forEach((listing) => {
      if (listing != null) {
        let price = listing.querySelector('span.ml-auto.font-semibold');
        if (price != null) {
          let priceText = price.textContent.trim();
          if (price.dataset.originalPrice != null) {
            priceText = price.dataset.originalPrice;
          }
          if (priceText.includes(",")) {
            priceText = priceText.replace(",", "."); // Handle European decimal format
          }
          let currencycode = priceText.match(/\b[a-z]+\b/gi)[0].toLowerCase();
          let amount = parseFloat(priceText.match(/\b[\d\.]+\b/g)[0]);
          price.dataset.originalPrice = priceText;
          price.dataset.originalcurrency = currencycode;

          if (currencycode != selectedCurrency && price.dataset.updatedCurrency != selectedCurrency && selectedCurrency != price.dataset.originalcurrency) {
            let convertedAmount = convertCurrency(amount, currencycode, selectedCurrency);
            if (convertedAmount != null) {
              price.style.fontWeight = "bold";
              price.style.color = "#4A90E2";
              price.style.textAlign = "right";
              price.innerHTML = `~${convertedAmount.toFixed(2)} ${selectedCurrency.toUpperCase()}<br><span style="color:#a7a7a7; font-size:0.9em">(${priceText})</span>`;
              price.dataset.updatedCurrency = selectedCurrency;
            }
          }
          if (price.dataset.originalcurrency != null && selectedCurrency == price.dataset.originalcurrency && price.dataset.updatedCurrency != selectedCurrency) {
            console.log("Reverting price display");
            price.innerHTML = priceText;
            price.style = "";
            price.dataset.updatedCurrency = null;
          }
          if (selectedCurrency === "none") {
            // Revert to original price display
            price.innerHTML = priceText;
            price.style = "";
            price.dataset.updatedCurrency = null;
            return;
          }
          // if (price.dataset.originalcurrency != null && selectedCurrency == price.dataset.originalcurrency && price.dataset.updatedCurrency != selectedCurrency && price.textContent != priceText) {
          //   console.log("Reverting price display");
          //   price.innerHTML = priceText;
          //   price.style = "";
          //   price.dataset.updatedCurrency = null;
          // };
        };
      };
    });
  };
};

function convertCurrency(amount, fromCurrency, toCurrency) {
  let fromRate = null;
  let toRate = null;
  for (let currencyKey in currenciesList.currencies) {
    if (currenciesList.currencies[currencyKey].code === fromCurrency) {
      fromRate = currenciesList.currencies[currencyKey].rate;
    }
    if (currenciesList.currencies[currencyKey].code === toCurrency) {
      toRate = currenciesList.currencies[currencyKey].rate;
    }
  }
  if (fromRate == null || toRate == null) {
    return null;
  }
  return (amount / fromRate) * toRate;
};

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
  fixBottomsLink();
  addTagSeachbox();
  if (!isUpdatingPrices) {
    isUpdatingPrices = true;
    observer.disconnect();// <--- disconnect before updating
    setTimeout(() => {
      updateListingsPrice();
      isUpdatingPrices = false;
      observer.observe(document.body, { subtree: true, childList: true }); // <--- reconnect after
    }, priceupdateInterval);
  }
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
});