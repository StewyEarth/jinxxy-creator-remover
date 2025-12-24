let hiddenCreators = [];
InitHiddenCreators();
function InitHiddenCreators(){
    browser.storage.local.get("creators").then((result) => {
        if (result.creators) {
            // Normalize all creator names to lowercase for comparison
            hiddenCreators = result.creators.map(name => name.toLowerCase());
            hiddenCreators.forEach((creator) => {
                addCreatorsToList(creator);
            });
        }else{
            browser.storage.local.set({ creators: [] });
        }
    });
}
console.log("Hidden creators loaded:", hiddenCreators);

function HideCreator(creatorNames) {
    let NewArrivals = document.querySelector('.py-12');
    if(NewArrivals != null){
        let newArrivalsListings = NewArrivals.querySelectorAll(".rounded-lg");
        newArrivalsListings.forEach(listing => {
            let listingLink = listing.querySelector("a");
            if (listingLink != null){
                let href = listingLink.href.toLowerCase();
                if (creatorNames.some(creatorName => href.includes(creatorName))){
                    listing.classList.add("hidden");
                }
        }});
    }
    let carousel = document.querySelector('[aria-roledescription="carousel"]');
    if(carousel != null){
        let carouselListings = carousel.querySelectorAll(".rounded-lg");
        carouselListings.forEach(listing => {
            let listingLink = listing.querySelector("a");
            if (listingLink != null){
                let href = listingLink.href.toLowerCase();
                if (creatorNames.some(creatorName => href.includes(creatorName))){
                    listing.classList.add("hidden");
                }  
        }});
    }
    let listings = document.querySelectorAll(".text-card-foreground");
    listings.forEach((listing)=>{
        if(listing != null){
            let userSpan = listing.querySelector(".decoration-2 span");
            if (userSpan != null){
                let user = userSpan.textContent.toLowerCase();
                if (creatorNames.includes(user)){
                    console.log("Hiding listing by " + user);
                    listing.classList.add("hidden");
            }
        }
    }
})
}


const observer = new MutationObserver(() => {
  HideCreator(hiddenCreators);
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
});