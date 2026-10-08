import { supabase } from "./supabase.js";
import {
  requireAdmin,
  adminLogout
} from "./admin-guard.js";


// ============================================
// DOM ELEMENTS
// ============================================

const totalUsersElement =
  document.querySelector("#total-users");

const totalFavoritesElement =
  document.querySelector("#total-favorites");

const totalSearchesElement =
  document.querySelector("#total-searches");

const totalResourcesElement =
  document.querySelector("#total-resources");

const recentActivityElement =
  document.querySelector("#recent-activity");

const adminUserNameElement =
  document.querySelector("#admin-user-name");

const adminAvatarLetterElement =
  document.querySelector("#admin-avatar-letter");

const logoutButton =
  document.querySelector("#admin-logout");

const menuButton =
  document.querySelector("#admin-menu-button");

const sidebar =
  document.querySelector("#admin-sidebar");


// ============================================
// FORMAT NUMBERS
// ============================================

function formatNumber(number) {
  return new Intl.NumberFormat().format(number || 0);
}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}


// ============================================
// LOAD ADMIN PROFILE
// ============================================

function displayAdminProfile(profile) {
  const name =
    profile?.full_name?.trim() ||
    "Administrator";

  if (adminUserNameElement) {
    adminUserNameElement.textContent = name;
  }

  if (adminAvatarLetterElement) {
    adminAvatarLetterElement.textContent =
      name.charAt(0).toUpperCase();
  }
}


// ============================================
// COUNT USERS
// ============================================

async function getUserCount() {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error(
      "Unable to load user count:",
      error
    );

    return 0;
  }

  return count || 0;
}


// ============================================
// COUNT FAVORITES
// ============================================

async function getFavoriteCount() {
  const { count, error } = await supabase
    .from("favorites")
    .select("id", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error(
      "Unable to load favorite count:",
      error
    );

    return 0;
  }

  return count || 0;
}


// ============================================
// COUNT SEARCHES
// ============================================

async function getSearchCount() {
  const { count, error } = await supabase
    .from("search_history")
    .select("id", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error(
      "Unable to load search count:",
      error
    );

    return 0;
  }

  return count || 0;
}


// ============================================
// COUNT RESOURCES
// ============================================

async function getResourceCount() {
  const { count, error } = await supabase
    .from("resources")
    .select("id", {
      count: "exact",
      head: true
    });

  if (error) {
    console.error(
      "Unable to load resource count:",
      error
    );

    return 0;
  }

  return count || 0;
}


// ============================================
// LOAD STATISTICS
// ============================================

async function loadStatistics() {
  const [
    users,
    favorites,
    searches,
    resources
  ] = await Promise.all([
    getUserCount(),
    getFavoriteCount(),
    getSearchCount(),
    getResourceCount()
  ]);

  if (totalUsersElement) {
    totalUsersElement.textContent =
      formatNumber(users);
  }

  if (totalFavoritesElement) {
    totalFavoritesElement.textContent =
      formatNumber(favorites);
  }

  if (totalSearchesElement) {
    totalSearchesElement.textContent =
      formatNumber(searches);
  }

  if (totalResourcesElement) {
    totalResourcesElement.textContent =
      formatNumber(resources);
  }
}


// ============================================
// ACTIVITY LABEL
// ============================================

function getActivityLabel(action) {
  const labels = {
    create_resource: "Resource created",
    update_resource: "Resource updated",
    delete_resource: "Resource deleted",

    create_category: "Category created",
    update_category: "Category updated",
    delete_category: "Category deleted",

    suspend_user: "User suspended",
    activate_user: "User activated",

    update_user_role: "User role updated",

    login: "Admin login",
    logout: "Admin logout"
  };

  return labels[action] ||
    action ||
    "Administrative activity";
}


// ============================================
// ACTIVITY ICON
// ============================================

function getActivityIcon(action) {
  if (!action) {
    return "📝";
  }

  if (action.includes("resource")) {
    return "📚";
  }

  if (action.includes("category")) {
    return "🗂️";
  }

  if (action.includes("user")) {
    return "👤";
  }

  if (
    action === "login" ||
    action === "logout"
  ) {
    return "🔐";
  }

  return "📝";
}


// ============================================
// LOAD RECENT AUDIT LOGS
// ============================================

async function loadRecentActivity() {
  if (!recentActivityElement) {
    return;
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      created_at
    `)
    .order("created_at", {
      ascending: false
    })
    .limit(8);

  if (error) {
    console.error(
      "Unable to load audit logs:",
      error
    );

    recentActivityElement.innerHTML = `
      <div class="admin-empty-state">
        <span>⚠️</span>
        <p>
          Unable to load recent activity.
        </p>
      </div>
    `;

    return;
  }

  if (!data || data.length === 0) {
    recentActivityElement.innerHTML = `
      <div class="admin-empty-state">
        <span>📝</span>
        <p>
          No administrative activity yet.
        </p>
      </div>
    `;

    return;
  }

  recentActivityElement.innerHTML =
    data.map((activity) => {

      const label =
        getActivityLabel(activity.action);

      const icon =
        getActivityIcon(activity.action);

      return `
        <article class="admin-activity-item">

          <div class="admin-activity-icon">
            ${icon}
          </div>

          <div class="admin-activity-content">

            <strong>
              ${escapeHtml(label)}
            </strong>

            <p>
              ${
                escapeHtml(
                  activity.entity_type ||
                  "System activity"
                )
              }
            </p>

          </div>

          <time
            class="admin-activity-time"
            datetime="${activity.created_at}"
          >
            ${escapeHtml(
              formatDate(activity.created_at)
            )}
          </time>

        </article>
      `;
    }).join("");
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================
// MOBILE MENU
// ============================================

function setupMobileMenu() {
  if (!menuButton || !sidebar) {
    return;
  }

  menuButton.addEventListener(
    "click",
    () => {

      const isOpen =
        sidebar.classList.toggle("open");

      menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }
  );


  // Close sidebar after selecting a link
  const links =
    sidebar.querySelectorAll(
      ".admin-nav-link"
    );

  links.forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        sidebar.classList.remove("open");

        menuButton.setAttribute(
          "aria-expanded",
          "false"
        );

      }
    );

  });
}


// ============================================
// LOGOUT
// ============================================

function setupLogout() {
  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener(
    "click",
    async () => {

      logoutButton.disabled = true;
      logoutButton.textContent =
        "Logging out...";

      try {
        await adminLogout();

      } catch (error) {

        console.error(
          "Logout failed:",
          error
        );

        logoutButton.disabled = false;

        logoutButton.innerHTML = `
          <span>↪</span>
          <span>Logout</span>
        `;

        alert(
          "Unable to log out. Please try again."
        );
      }
    }
  );
}


// ============================================
// INITIALIZE ADMIN DASHBOARD
// ============================================

async function initializeAdminDashboard() {

  /*
   * This is the most important security check.
   *
   * A normal user cannot simply visit:
   *
   * /admin/index.html
   *
   * and access the dashboard.
   */

  const admin =
    await requireAdmin();

  if (!admin) {
    return;
  }


  // Display administrator information
  displayAdminProfile(
    admin.profile
  );


  // Setup interface
  setupMobileMenu();
  setupLogout();


  // Load dashboard data
  await Promise.all([
    loadStatistics(),
    loadRecentActivity()
  ]);
}


// ============================================
// START
// ============================================

initializeAdminDashboard();