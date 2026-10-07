import { searchMedicines, searchMedicinesRxNav } from "./api.js";


// ============================================
// DOM Elements
// ============================================

const searchForm =
  document.querySelector("#medicine-search-form");

const searchInput =
  document.querySelector("#medicine-search");

const resultsContainer =
  document.querySelector("#medicine-results");

const searchStatus =
  document.querySelector("#search-status");

const menuButton =
  document.querySelector("#menu-button");

const siteNav =
  document.querySelector("#site-nav");


// ============================================
// Mobile Navigation
// ============================================

if (menuButton && siteNav) {

  menuButton.addEventListener("click", () => {

    const isOpen =
      siteNav.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      isOpen
    );

  });

}


// ============================================
// Get Search Parameter
// ============================================

const urlParams =
  new URLSearchParams(window.location.search);

const initialSearch =
  urlParams.get("search");


// ============================================
// Search Form
// ============================================

searchForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const searchTerm =
      searchInput.value.trim();

    if (!searchTerm) {

      searchInput.focus();

      return;
    }

    await loadMedicines(searchTerm);

  }
);


// ============================================
// Load Initial Search
// ============================================

if (initialSearch) {

  searchInput.value =
    initialSearch;

  loadMedicines(initialSearch);

}

async function loadMedicines(searchTerm) {
  showLoading();
  try {
    let medicines = await searchMedicines(searchTerm);

    // If FDA finds nothing, try RxNav
    if (!medicines.length) {
      const rxResults = await searchMedicinesRxNav(searchTerm);
      // You can decide to show RxNav results or just show "not found"
      console.log("RxNav fallback:", rxResults);
    }

    displayMedicines(medicines, searchTerm);
  } catch (error) {
    console.error("Medicine search error:", error);
    showError();
  }
}

// ============================================
// Loading State
// ============================================

function showLoading() {

  searchStatus.textContent =
    "Searching medicine information...";

  resultsContainer.innerHTML = "";

}


// ============================================
// Display Medicines
// ============================================

function displayMedicines(
  medicines,
  searchTerm
) {

  if (!medicines.length) {

    searchStatus.textContent =
      `No medicine results found for "${searchTerm}".`;

    resultsContainer.innerHTML = `
      <div class="empty-state">

        <h3>
          No Medicines Found
        </h3>

        <p>
          We couldn't find medicine information matching
          "${escapeHTML(searchTerm)}".
          Try another medicine name.
        </p>

      </div>
    `;

    return;
  }


  searchStatus.textContent =
    `${medicines.length} medicine result(s) found.`;


  resultsContainer.innerHTML =
    medicines
      .map(createMedicineCard)
      .join("");

}


// ============================================
// Create Medicine Card
// ============================================

function createMedicineCard(medicine) {

  const openFDA =
    medicine.openfda || {};

  const setId =
    medicine.set_id || "";

  const brandName =
    getFirstValue(openFDA.brand_name);

  const genericName =
    getFirstValue(openFDA.generic_name);

  const manufacturer =
    getFirstValue(openFDA.manufacturer_name);

  const dosageForm =
    getFirstValue(openFDA.dosage_form);

  const route =
    getFirstValue(openFDA.route);

  return `
    <article class="medicine-card">

      <h3>
        ${escapeHTML(
          brandName || genericName || "Medicine"
        )}
      </h3>

      <p>
        <strong>Generic:</strong>
        ${escapeHTML(
          genericName || "Not available"
        )}
      </p>

      <p>
        <strong>Manufacturer:</strong>
        ${escapeHTML(
          manufacturer || "Not available"
        )}
      </p>

      <p>
        <strong>Dosage form:</strong>
        ${escapeHTML(
          dosageForm || "Not available"
        )}
      </p>

      <p>
        <strong>Route:</strong>
        ${escapeHTML(
          route || "Not available"
        )}
      </p>

      <div class="medicine-card-actions">

  <a
    class="card-button"
    href="./medicine-details.html?set_id=${encodeURIComponent(setId)}"
  >
    View Details
  </a>

  <button
    class="card-button"
    type="button"
    disabled
    title="Favorites feature will be added later"
  >
    ☆ Save
  </button>

</div>

    </article>
  `;
}


// ============================================
// Get First Array Value
// ============================================

function getFirstValue(value) {

  if (Array.isArray(value)) {

    return value[0] || "";

  }

  return value || "";

}


// ============================================
// Escape HTML
// ============================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================
// Error State
// ============================================

function showError() {

  searchStatus.textContent =
    "Unable to load medicine information.";

  resultsContainer.innerHTML = `
    <div class="error-state">

      <h3>
        Something Went Wrong
      </h3>

      <p>
        We couldn't retrieve medicine information
        right now. Please check your internet connection
        and try again.
      </p>

    </div>
  `;

}