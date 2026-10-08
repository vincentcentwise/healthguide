import { supabase } from "./supabase.js";
import {
  requireAdmin,
  adminLogout
} from "./admin-guard.js";


// ============================================
// DOM ELEMENTS
// ============================================

const tableBody = document.getElementById("auditLogsTable");

const searchInput =
  document.getElementById("searchLogs");

const actionFilter =
  document.getElementById("actionFilter");

const resourceFilter =
  document.getElementById("resourceFilter");

const dateFilter =
  document.getElementById("dateFilter");

const totalLogs =
  document.getElementById("totalLogs");

const activeAdmins =
  document.getElementById("activeAdmins");

const resourceActions =
  document.getElementById("resourceActions");

const userActions =
  document.getElementById("userActions");

const adminName =
  document.getElementById("adminName");

const adminAvatar =
  document.getElementById("adminAvatar");

const logoutButton =
  document.getElementById("logoutButton");

const refreshLogsButton =
  document.getElementById("refreshLogsButton");

const retryLogsButton =
  document.getElementById("retryLogsButton");

const errorState =
  document.getElementById("errorState");

const errorMessage =
  document.getElementById("errorMessage");

const emptyState =
  document.getElementById("emptyState");

const menuToggle =
  document.getElementById("menuToggle");

const adminSidebar =
  document.getElementById("adminSidebar");


// ============================================
// STATE
// ============================================

let currentAdmin = null;
let allLogs = [];


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

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
// FORMAT DATE
// ============================================

function formatDate(dateValue) {

  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}


// ============================================
// ACTION LABEL
// ============================================

function formatAction(action) {

  if (!action) {
    return "Unknown";
  }

  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


// ============================================
// ACTION CLASS
// ============================================

function getActionClass(action) {

  const normalized =
    String(action || "").toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("suspend")
  ) {
    return "danger";
  }

  if (
    normalized.includes("publish") ||
    normalized.includes("reactivate")
  ) {
    return "success";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("edit")
  ) {
    return "warning";
  }

  return "neutral";
}


// ============================================
// LOAD ADMIN INFORMATION
// ============================================

function displayAdmin(profile) {

  const name =
    profile?.full_name ||
    "Administrator";

  adminName.textContent = name;

  adminAvatar.textContent =
    name.charAt(0).toUpperCase();
}


// ============================================
// LOAD AUDIT LOGS
// ============================================

async function loadAuditLogs() {

  hideError();

  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="admin-table-loading">
        Loading audit logs...
      </td>
    </tr>
  `;

  try {

    const {
      data,
      error
    } = await supabase
      .from("audit_logs")
      .select(`
        id,
        admin_id,
        action,
        resource_type,
        resource_id,
        created_at,
        metadata
      `)
      .order("created_at", {
        ascending: false
      })
      .limit(500);

    if (error) {
      throw error;
    }

    allLogs = data || [];

    await loadStatistics();

    renderLogs();

  } catch (error) {

    console.error(
      "Failed to load audit logs:",
      error
    );

    showError(
      error.message ||
      "Unable to load audit logs."
    );

  }
}


// ============================================
// LOAD STATISTICS
// ============================================

async function loadStatistics() {

  totalLogs.textContent =
    allLogs.length.toLocaleString();


  // ------------------------------------------
  // Resource actions
  // ------------------------------------------

  const resourceCount =
    allLogs.filter(log =>
      log.resource_type === "resource"
    ).length;

  resourceActions.textContent =
    resourceCount.toLocaleString();


  // ------------------------------------------
  // User actions
  // ------------------------------------------

  const userCount =
    allLogs.filter(log =>
      log.resource_type === "user"
    ).length;

  userActions.textContent =
    userCount.toLocaleString();


  // ------------------------------------------
  // Active administrators
  // ------------------------------------------

  const uniqueAdmins =
    new Set(
      allLogs
        .map(log => log.admin_id)
        .filter(Boolean)
    );

  activeAdmins.textContent =
    uniqueAdmins.size.toLocaleString();
}


// ============================================
// FILTER LOGS
// ============================================

function getFilteredLogs() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const action =
    actionFilter.value;

  const resourceType =
    resourceFilter.value;

  const date =
    dateFilter.value;

  const now =
    new Date();

  return allLogs.filter(log => {

    // ----------------------------------------
    // Search
    // ----------------------------------------

    const searchableText = [

      log.action,

      log.resource_type,

      log.resource_id,

      log.admin_id,

      JSON.stringify(log.metadata || {})

    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


    if (
      search &&
      !searchableText.includes(search)
    ) {
      return false;
    }


    // ----------------------------------------
    // Action
    // ----------------------------------------

    if (
      action !== "all" &&
      String(log.action).toLowerCase() !== action
    ) {
      return false;
    }


    // ----------------------------------------
    // Resource type
    // ----------------------------------------

    if (
      resourceType !== "all" &&
      log.resource_type !== resourceType
    ) {
      return false;
    }


    // ----------------------------------------
    // Date
    // ----------------------------------------

    if (date !== "all") {

      const logDate =
        new Date(log.created_at);

      const difference =
        now - logDate;

      const days =
        Number(date);

      if (
        !Number.isNaN(days) &&
        difference >
          days * 24 * 60 * 60 * 1000
      ) {
        return false;
      }


      if (date === "today") {

        const sameDay =
          logDate.toDateString() ===
          now.toDateString();

        if (!sameDay) {
          return false;
        }

      }

    }

    return true;

  });

}


// ============================================
// RENDER LOGS
// ============================================

function renderLogs() {

  const logs =
    getFilteredLogs();


  // ------------------------------------------
  // Empty
  // ------------------------------------------

  if (!logs.length) {

    tableBody.innerHTML = "";

    emptyState.hidden = false;

    return;

  }

  emptyState.hidden = true;


  tableBody.innerHTML =
    logs.map(log => {

      const actionClass =
        getActionClass(log.action);

      return `
        <tr>

          <td>

            <div class="admin-table-user">

              <div class="admin-avatar small">
                ${(log.admin_id || "A")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  Administrator
                </strong>

                <span>
                  ${escapeHTML(
                    log.admin_id || "Unknown"
                  )}
                </span>
              </div>

            </div>

          </td>


          <td>

            <span
              class="admin-badge ${actionClass}"
            >
              ${escapeHTML(
                formatAction(log.action)
              )}
            </span>

          </td>


          <td>

            <div>
              <strong>
                ${escapeHTML(
                  log.resource_type || "System"
                )}
              </strong>
            </div>

          </td>


          <td>

            <code class="admin-resource-id">
              ${escapeHTML(
                log.resource_id || "—"
              )}
            </code>

          </td>


          <td>

            <time datetime="${escapeHTML(
              log.created_at || ""
            )}">
              ${escapeHTML(
                formatDate(log.created_at)
              )}
            </time>

          </td>

        </tr>
      `;

    })
    .join("");
}


// ============================================
// ERROR HANDLING
// ============================================

function showError(message) {

  errorMessage.textContent =
    message;

  errorState.hidden = false;

  tableBody.innerHTML = "";

  emptyState.hidden = true;
}


function hideError() {

  errorState.hidden = true;

}


// ============================================
// EVENT LISTENERS
// ============================================

searchInput.addEventListener(
  "input",
  renderLogs
);

actionFilter.addEventListener(
  "change",
  renderLogs
);

resourceFilter.addEventListener(
  "change",
  renderLogs
);

dateFilter.addEventListener(
  "change",
  renderLogs
);


refreshLogsButton.addEventListener(
  "click",
  loadAuditLogs
);


retryLogsButton.addEventListener(
  "click",
  loadAuditLogs
);


logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await adminLogout();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to log out. Please try again."
      );

    }

  }
);


// ============================================
// MOBILE SIDEBAR
// ============================================

menuToggle.addEventListener(
  "click",
  () => {

    adminSidebar.classList.toggle(
      "open"
    );

  }
);


// ============================================
// INITIALIZE
// ============================================

async function initialize() {

  const admin =
    await requireAdmin();

  if (!admin) {
    return;
  }

  currentAdmin = admin;

  displayAdmin(
    admin.profile
  );

  await loadAuditLogs();

}


initialize();