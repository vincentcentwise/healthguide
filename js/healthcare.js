
const searchForm = document.querySelector("#healthcareSearchForm");
const locationInput = document.querySelector("#locationInput");
const facilityType = document.querySelector("#facilityType");
const resultsSection = document.querySelector("#resultsSection");
const resultsGrid = document.querySelector("#resultsGrid");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsDescription = document.querySelector("#resultsDescription");
const clearResultsButton = document.querySelector("#clearResultsButton");

const facilityDetails = {
  hospital: {
    label: "Hospitals",
    singular: "hospital",
    icon: "✚",
    description: "General hospitals, specialist hospitals, and emergency departments."
  },
  clinic: {
    label: "Clinics",
    singular: "clinic",
    icon: "⌂",
    description: "Local clinics, outpatient centres, and primary healthcare services."
  },
  pharmacy: {
    label: "Pharmacies",
    singular: "pharmacy",
    icon: "✚",
    description: "Community pharmacies and medicine-dispensing services."
  },
  laboratory: {
    label: "Medical laboratories",
    singular: "medical laboratory",
    icon: "⚗",
    description: "Diagnostic laboratories and medical testing centres."
  },
  doctor: {
    label: "Doctors",
    singular: "doctor",
    icon: "♙",
    description: "Doctors, medical practices, and consultation services."
  },
  dentist: {
    label: "Dental clinics",
    singular: "dental clinic",
    icon: "✦",
    description: "Dental practices and oral healthcare services."
  }
};

function createMapLinks(query) {
  const encodedQuery = encodeURIComponent(query);

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
    openStreetMap: `https://www.openstreetmap.org/search?query=${encodedQuery}`
  };
}

function createResultCard(type, location) {
  const facility = facilityDetails[type];
  const query = `${facility.singular} in ${location}`;
  const links = createMapLinks(query);

  const article = document.createElement("article");
  article.className = "result-card";

  const icon = document.createElement("span");
  icon.className = "result-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = facility.icon;

  const heading = document.createElement("h3");
  heading.textContent = facility.label;

  const description = document.createElement("p");
  description.textContent = facility.description;

  const locationText = document.createElement("p");
  locationText.textContent = `Search area: ${location}`;

  const linkGroup = document.createElement("div");
  linkGroup.className = "result-links";

  const googleLink = document.createElement("a");
  googleLink.href = links.google;
  googleLink.target = "_blank";
  googleLink.rel = "noopener noreferrer";
  googleLink.textContent = "Google Maps ↗";
  googleLink.setAttribute(
    "aria-label",
    `Find ${facility.label.toLowerCase()} in ${location} on Google Maps`
  );

  const osmLink = document.createElement("a");
  osmLink.href = links.openStreetMap;
  osmLink.target = "_blank";
  osmLink.rel = "noopener noreferrer";
  osmLink.textContent = "OpenStreetMap ↗";
  osmLink.setAttribute(
    "aria-label",
    `Find ${facility.label.toLowerCase()} in ${location} on OpenStreetMap`
  );

  linkGroup.append(googleLink, osmLink);
  article.append(icon, heading, description, locationText, linkGroup);

  return article;
}

function getSelectedTypes(selectedType) {
  if (selectedType === "all") {
    return Object.keys(facilityDetails);
  }

  return facilityDetails[selectedType] ? [selectedType] : ["hospital"];
}

function runSearch(selectedType, location) {
  const cleanLocation = location.trim();

  if (!cleanLocation) {
    locationInput.setCustomValidity("Enter a city, town, or neighbourhood.");
    locationInput.reportValidity();
    locationInput.setCustomValidity("");
    locationInput.focus();
    return;
  }

  const types = getSelectedTypes(selectedType);

  resultsGrid.replaceChildren();

  types.forEach((type) => {
    resultsGrid.appendChild(createResultCard(type, cleanLocation));
  });

  resultsTitle.textContent =
    selectedType === "all"
      ? "Healthcare facilities"
      : facilityDetails[selectedType].label;

  resultsDescription.textContent =
    `Explore ${types.length === 1
      ? facilityDetails[types[0]].label.toLowerCase()
      : "different healthcare facilities"} in ${cleanLocation}.`;

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start"
  });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(facilityType.value, locationInput.value);
});

document.querySelectorAll("[data-type]").forEach((card) => {
  card.addEventListener("click", () => {
    facilityType.value = card.dataset.type;

    if (!locationInput.value.trim()) {
      locationInput.focus();
      document.querySelector(".hero").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    runSearch(card.dataset.type, locationInput.value);
  });
});

clearResultsButton.addEventListener("click", () => {
  resultsGrid.replaceChildren();
  resultsSection.hidden = true;
  locationInput.focus();
});
