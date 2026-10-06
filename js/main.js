
// ============================================
// Mobile Navigation
// ============================================

const menuButton = document.querySelector("#menu-button");
const siteNav = document.querySelector("#site-nav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", isOpen);
  });
}


// ============================================
// Homepage Search
// ============================================

const homeSearchForm = document.querySelector("#home-search-form");

if (homeSearchForm) {
  homeSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const searchInput = document.querySelector("#home-search");
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
      searchInput.focus();
      return;
    }

    const encodedSearch = encodeURIComponent(searchTerm);

    window.location.href =
      `./medicines.html?search=${encodedSearch}`;
  });
}

