import { getMedicineBySetId } from "./api.js";


// ============================================
// DOM Elements
// ============================================

const detailsContainer =
  document.querySelector("#medicine-details");

const medicineTitle =
  document.querySelector("#medicine-title");

const medicineStatus =
  document.querySelector("#medicine-status");

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
// Get Medicine ID From URL
// ============================================

const urlParams =
  new URLSearchParams(window.location.search);

const setId =
  urlParams.get("set_id");


// ============================================
// Validate ID
// ============================================

if (!setId) {

  showError(
    "No medicine was selected."
  );

} else {

  loadMedicineDetails(setId);

}


// ============================================
// Load Medicine Details
// ============================================

async function loadMedicineDetails(setId) {

  try {

    medicineStatus.textContent =
      "Loading medicine information...";

    const medicine =
      await getMedicineBySetId(setId);


    if (!medicine) {

      showError(
        "Medicine information could not be found."
      );

      return;
    }


    displayMedicineDetails(medicine);

  } catch (error) {

    console.error(
      "Medicine details error:",
      error
    );

    showError(
      "Unable to retrieve medicine information."
    );

  }

}


// ============================================
// Display Medicine Details
// ============================================

function displayMedicineDetails(medicine) {

  const openFDA =
    medicine.openfda || {};


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

  const purpose =
    getFirstValue(
      medicine.purpose
    );

  const indications =
    getFirstValue(
      medicine.indications_and_usage
    );

  const warnings =
    getFirstValue(
      medicine.warnings
    );

  const dosage =
    getFirstValue(
      medicine.dosage_and_administration
    );

  const activeIngredient =
    getFirstValue(
      medicine.active_ingredient
    );

  const inactiveIngredient =
    getFirstValue(
      medicine.inactive_ingredient
    );


  const displayName =
    brandName ||
    genericName ||
    "Medicine";


  medicineTitle.textContent =
    displayName;

  document.title =
    `${displayName} | HealthGuide`;


  medicineStatus.textContent =
    "Medicine information loaded.";


  detailsContainer.innerHTML = `

    <div class="details-header">

      <p class="eyebrow">
        MEDICINE
      </p>

      <h2>
        ${escapeHTML(displayName)}
      </h2>

      ${
        genericName
          ? `
            <p class="generic-name">
              Generic name:
              <strong>
                ${escapeHTML(genericName)}
              </strong>
            </p>
          `
          : ""
      }

    </div>


    <div class="details-grid">

      ${createDetailSection(
        "Manufacturer",
        manufacturer
      )}

      ${createDetailSection(
        "Dosage Form",
        dosageForm
      )}

      ${createDetailSection(
        "Route",
        route
      )}

      ${createDetailSection(
        "Active Ingredient",
        activeIngredient
      )}

    </div>


    ${createLongSection(
      "Purpose",
      purpose
    )}

    ${createLongSection(
      "Indications and Usage",
      indications
    )}

    ${createLongSection(
      "Dosage and Administration",
      dosage
    )}

    ${createLongSection(
      "Warnings",
      warnings,
      true
    )}

    ${createLongSection(
      "Inactive Ingredients",
      inactiveIngredient
    )}

  `;

}


// ============================================
// Create Small Detail Section
// ============================================

function createDetailSection(
  title,
  value
) {

  return `

    <section class="detail-box">

      <h3>
        ${title}
      </h3>

      <p>
        ${escapeHTML(
          value || "Not available"
        )}
      </p>

    </section>

  `;

}


// ============================================
// Create Long Detail Section
// ============================================

function createLongSection(
  title,
  value,
  warning = false
) {

  if (!value) {
    return "";
  }

  return `

    <section
      class="detail-section ${
        warning ? "warning-section" : ""
      }"
    >

      <h3>
        ${title}
      </h3>

      <p>
        ${escapeHTML(value)}
      </p>

    </section>

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

function showError(message) {

  medicineStatus.textContent =
    "";

  detailsContainer.innerHTML = `

    <div class="error-state">

      <h2>
        Unable to Load Medicine
      </h2>

      <p>
        ${escapeHTML(message)}
      </p>

      <a
        href="./medicines.html"
        class="button primary-button"
      >
        Back to Medicines
      </a>

    </div>

  `;

}