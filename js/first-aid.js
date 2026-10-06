// ============================================
// FIRST AID DATA
// ============================================

let firstAidResources = [];

let activeCategory = "all";


// ============================================
// DOM ELEMENTS
// ============================================

const resultsContainer =
  document.querySelector("#first-aid-results");

const statusElement =
  document.querySelector("#first-aid-status");

const searchInput =
  document.querySelector("#first-aid-search");

const clearSearchButton =
  document.querySelector("#clear-search");

const categoryContainer =
  document.querySelector("#category-filters");

const resourceCount =
  document.querySelector("#resource-count");


// ============================================
// LOAD DATA
// ============================================

async function loadFirstAidResources() {

  statusElement.innerHTML = `
    <div class="loading-state">
      Loading first-aid resources...
    </div>
  `;


  try {

    const response =
      await fetch("./data/firstAid.json");


    if (!response.ok) {
      throw new Error(
        "Unable to load first-aid resources."
      );
    }


    firstAidResources =
      await response.json();


    createCategoryButtons();

    renderResources();


  } catch (error) {

    console.error(
      "First Aid Error:",
      error
    );


    statusElement.innerHTML = `
      <div class="error-state">

        <h2>
          Unable to load resources
        </h2>

        <p>
          We could not load the first-aid
          resources right now.
        </p>

        <button
          type="button"
          id="retry-first-aid"
        >
          Try Again
        </button>

      </div>
    `;


    document
      .querySelector("#retry-first-aid")
      ?.addEventListener(
        "click",
        loadFirstAidResources
      );

  }

}


// ============================================
// CREATE CATEGORY BUTTONS
// ============================================

function createCategoryButtons() {

  const categories = [
    ...new Set(
      firstAidResources.map(
        resource => resource.category
      )
    )
  ];


  categoryContainer.innerHTML = "";


  const allButton =
    createCategoryButton(
      "all",
      "All"
    );


  allButton.classList.add("active");

  categoryContainer.appendChild(
    allButton
  );


  categories.forEach(category => {

    const button =
      createCategoryButton(
        category,
        category
      );


    categoryContainer.appendChild(
      button
    );

  });

}


// ============================================
// CATEGORY BUTTON
// ============================================

function createCategoryButton(
  category,
  label
) {

  const button =
    document.createElement("button");


  button.type = "button";

  button.className =
    "category-button";


  button.dataset.category =
    category;


  button.textContent =
    label;


  button.addEventListener(
    "click",
    () => {

      activeCategory =
        category;


      document
        .querySelectorAll(
          ".category-button"
        )
        .forEach(button => {

          button.classList.toggle(
            "active",
            button.dataset.category === category
          );

        });


      renderResources();

    }
  );


  return button;
}


// ============================================
// FILTER RESOURCES
// ============================================

function getFilteredResources() {

  const searchTerm =
    searchInput.value
      .trim()
      .toLowerCase();


  return firstAidResources.filter(
    resource => {

      const matchesCategory =
        activeCategory === "all" ||
        resource.category === activeCategory;


      const searchableText = [
        resource.title,
        resource.category,
        resource.shortDescription,
        ...(resource.steps || [])
      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !searchTerm ||
        searchableText.includes(searchTerm);


      return (
        matchesCategory &&
        matchesSearch
      );

    }
  );

}


// ============================================
// RENDER RESOURCES
// ============================================

function renderResources() {

  const resources =
    getFilteredResources();


  resultsContainer.innerHTML = "";

  statusElement.innerHTML = "";


  resourceCount.textContent =
    `${resources.length} resource${
      resources.length === 1
        ? ""
        : "s"
    }`;


  if (!resources.length) {

    resultsContainer.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h2>
          No resources found
        </h2>

        <p>
          Try a different search term
          or category.
        </p>

      </div>

    `;

    return;
  }


  resources.forEach(resource => {

    resultsContainer.appendChild(
      createResourceCard(resource)
    );

  });

}


// ============================================
// RESOURCE CARD
// ============================================

function createResourceCard(resource) {

  const article =
    document.createElement("article");


  article.className =
    "first-aid-card";


  article.innerHTML = `

    <div class="resource-icon">
      ${resource.icon}
    </div>


    <div class="resource-card-content">

      <div class="resource-meta">

        <span class="resource-category">
          ${escapeHTML(resource.category)}
        </span>

        ${
          resource.emergency
            ? `
              <span class="emergency-badge">
                Emergency
              </span>
            `
            : ""
        }

      </div>


      <h3>
        ${escapeHTML(resource.title)}
      </h3>


      <p>
        ${escapeHTML(resource.shortDescription)}
      </p>


      <button
        class="view-resource-button"
        type="button"
        data-resource-id="${escapeHTML(resource.id)}"
      >
        View First Aid Guide
      </button>

    </div>

  `;


  article
    .querySelector(
      ".view-resource-button"
    )
    .addEventListener(
      "click",
      () => openResourceModal(resource)
    );


  return article;
}


// ============================================
// RESOURCE MODAL
// ============================================

function openResourceModal(resource) {

  const existingModal =
    document.querySelector(
      "#first-aid-modal"
    );


  existingModal?.remove();


  const modal =
    document.createElement("div");


  modal.id =
    "first-aid-modal";


  modal.className =
    "first-aid-modal";


  modal.innerHTML = `

    <div
      class="modal-overlay"
      data-close-modal
    ></div>


    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >

      <button
        type="button"
        class="modal-close"
        aria-label="Close first-aid guide"
        data-close-modal
      >
        ×
      </button>


      <div class="modal-icon">
        ${resource.icon}
      </div>


      <span class="resource-category">
        ${escapeHTML(resource.category)}
      </span>


      <h2 id="modal-title">
        ${escapeHTML(resource.title)}
      </h2>


      <p class="modal-description">
        ${escapeHTML(resource.shortDescription)}
      </p>


      <div class="guide-section">

        <h3>
          Basic Steps
        </h3>

        <ol>

          ${resource.steps
            .map(
              step =>
                `<li>${escapeHTML(step)}</li>`
            )
            .join("")
          }

        </ol>

      </div>


      <div class="help-section">

        <h3>
          When to Get Professional Help
        </h3>

        <p>
          ${escapeHTML(resource.whenToGetHelp)}
        </p>

      </div>


      ${
        resource.emergency
          ? `
            <div class="emergency-notice">

              <strong>
                Emergency Resource
              </strong>

              <p>
                If someone is in immediate danger
                or cannot breathe normally, contact
                your local emergency medical service
                immediately.
              </p>

            </div>
          `
          : ""
      }


      <p class="modal-disclaimer">

        HealthGuide provides educational information
        only. This guide does not replace professional
        medical advice or certified first-aid training.

      </p>

    </div>

  `;


  document.body.appendChild(modal);


  document.body.classList.add(
    "modal-open"
  );


  modal
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(element => {

      element.addEventListener(
        "click",
        closeModal
      );

    });


  document.addEventListener(
    "keydown",
    handleModalEscape
  );

}


// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {

  const modal =
    document.querySelector(
      "#first-aid-modal"
    );


  modal?.remove();


  document.body.classList.remove(
    "modal-open"
  );


  document.removeEventListener(
    "keydown",
    handleModalEscape
  );

}


function handleModalEscape(event) {

  if (event.key === "Escape") {
    closeModal();
  }

}


// ============================================
// SEARCH
// ============================================

searchInput.addEventListener(
  "input",
  renderResources
);


clearSearchButton.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    activeCategory = "all";


    document
      .querySelectorAll(
        ".category-button"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.category === "all"
        );

      });


    renderResources();

    searchInput.focus();

  }
);


// ============================================
// MOBILE NAVIGATION
// ============================================

const menuToggle =
  document.querySelector("#menu-toggle");

const mainNav =
  document.querySelector("#main-nav");


if (menuToggle && mainNav) {

  menuToggle.addEventListener(
    "click",
    () => {

      const isOpen =
        mainNav.classList.toggle("open");


      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    }
  );

}


// ============================================
// HTML ESCAPE
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
// INITIALIZE
// ============================================

loadFirstAidResources();