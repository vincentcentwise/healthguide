
import { supabase } from "./supabase.js";
import { requireAdmin, adminLogout } from "./admin-guard.js";

const tableBody = document.querySelector("#users-table-body");
const searchInput = document.querySelector("#user-search");
const roleFilter = document.querySelector("#role-filter");
const statusFilter = document.querySelector("#status-filter");
const resultsCount = document.querySelector("#results-count");
const pageMessage = document.querySelector("#page-message");
const detailsDialog = document.querySelector("#user-details-dialog");

let currentAdmin = null;
let users = [];
let busyIds = new Set();

const byId = id => document.getElementById(id);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function normalStatus(user) {
  return ["active", "suspended", "deleted"].includes(user.status)
    ? user.status
    : "unknown";
}

function displayName(user) {
  return user.full_name?.trim() || "Unnamed account";
}

function showMessage(message, isError = false) {
  pageMessage.textContent = message;
  pageMessage.classList.toggle("error", isError);
  pageMessage.hidden = false;
}

function clearMessage() {
  pageMessage.hidden = true;
  pageMessage.textContent = "";
  pageMessage.classList.remove("error");
}

function updateStatistics() {
  byId("total-users").textContent = users.length;

  byId("active-users").textContent =
    users.filter(user => normalStatus(user) === "active").length;

  byId("admin-users").textContent =
    users.filter(user => user.role === "admin").length;

  byId("suspended-users").textContent =
    users.filter(user => normalStatus(user) === "suspended").length;
}

function filteredUsers() {
  const term = searchInput.value.trim().toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;

  return users.filter(user => {
    const matchesTerm =
      displayName(user).toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term);

    const matchesRole =
      role === "all" || user.role === role;

    const matchesStatus =
      status === "all" || normalStatus(user) === status;

    return matchesTerm && matchesRole && matchesStatus;
  });
}

function renderUsers() {
  const visibleUsers = filteredUsers();

  resultsCount.textContent =
    `${visibleUsers.length} account${visibleUsers.length === 1 ? "" : "s"} shown`;

  if (!visibleUsers.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-state">
          No accounts match these filters.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = visibleUsers.map(user => {
    const status = normalStatus(user);
    const role = user.role === "admin" ? "admin" : "user";
    const shortId = `${user.id.slice(0, 8)}…`;
    const busy = busyIds.has(user.id);

    const statusLabel = {
      active: "Active",
      suspended: "Suspended",
      deleted: "Deactivated",
      unknown: "Unspecified"
    }[status];

    let statusAction = "";

    // Do not allow an admin to suspend or deactivate their own account.
    if (user.id !== currentAdmin.user.id) {
      if (status === "active") {
        statusAction = `
          <button class="action-button action-suspend"
            data-action="suspend" data-id="${escapeHTML(user.id)}"
            ${busy ? "disabled" : ""}>
            Suspend
          </button>
        `;
      } else if (status === "suspended") {
        statusAction = `
          <button class="action-button action-activate"
            data-action="activate" data-id="${escapeHTML(user.id)}"
            ${busy ? "disabled" : ""}>
            Reactivate
          </button>
        `;
      } else if (status === "deleted") {
        statusAction = `
          <button class="action-button action-activate"
            data-action="activate" data-id="${escapeHTML(user.id)}"
            ${busy ? "disabled" : ""}>
            Restore
          </button>
        `;
      }
    }

    return `
      <tr>
        <td>
          <span class="account-name">${escapeHTML(displayName(user))}</span>
          <span class="account-id" title="${escapeHTML(user.id)}">${escapeHTML(shortId)}</span>
        </td>
        <td>
          <span class="role-pill role-${role}">${role === "admin" ? "Admin" : "User"}</span>
        </td>
        <td>
          <span class="status-pill status-${status}">${statusLabel}</span>
        </td>
        <td>${escapeHTML(formatDate(user.created_at))}</td>
        <td>
          <div class="row-actions">
            <button class="action-button"
              data-action="view" data-id="${escapeHTML(user.id)}">
              View
            </button>
            ${statusAction}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadUsers() {
  clearMessage();

  tableBody.innerHTML = `
    <tr><td colspan="5" class="table-state">Loading accounts…</td></tr>
  `;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    users = data || [];
    updateStatistics();
    renderUsers();
  } catch (error) {
    console.error("Unable to load user profiles:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-state">
          Unable to load accounts. Check the console for the database error.
        </td>
      </tr>
    `;

    showMessage(
      error.message || "Unable to load user profiles.",
      true
    );
  }
}

function openDetails(user) {
  byId("detail-name").textContent = displayName(user);
  byId("detail-id").textContent = user.id;
  byId("detail-role").textContent = user.role || "user";
  byId("detail-status").textContent = normalStatus(user);
  byId("detail-created").textContent = formatDate(user.created_at);
  byId("detail-updated").textContent = formatDate(user.updated_at);

  detailsDialog.showModal();
}

async function changeStatus(userId, nextStatus) {
  const user = users.find(item => item.id === userId);
  if (!user) return;

  if (user.id === currentAdmin.user.id) {
    showMessage("You cannot change your own account status here.", true);
    return;
  }

  const actionText = nextStatus === "active"
    ? "reactivate or restore"
    : "suspend";

  if (!window.confirm(
    `Are you sure you want to ${actionText} ${displayName(user)}?`
  )) {
    return;
  }

  busyIds.add(userId);
  clearMessage();
  renderUsers();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", userId)
      .select("id, full_name, role, status, created_at, updated_at")
      .single();

    if (error) throw error;

    users = users.map(item => item.id === userId ? data : item);

    showMessage(
      `Account status updated to "${nextStatus}".`
    );

    updateStatistics();
  } catch (error) {
    console.error("Unable to update account status:", error);

    showMessage(
      error.message ||
      "Unable to update account status. Check admin permissions and RLS policies.",
      true
    );
  } finally {
    busyIds.delete(userId);
    renderUsers();
  }
}

tableBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const user = users.find(item => item.id === button.dataset.id);
  if (!user) return;

  if (button.dataset.action === "view") {
    openDetails(user);
  }

  if (button.dataset.action === "suspend") {
    changeStatus(user.id, "suspended");
  }

  if (button.dataset.action === "activate") {
    changeStatus(user.id, "active");
  }
});

searchInput.addEventListener("input", renderUsers);
roleFilter.addEventListener("change", renderUsers);
statusFilter.addEventListener("change", renderUsers);

byId("refresh-users").addEventListener("click", loadUsers);
byId("close-details").addEventListener("click", () => detailsDialog.close());

byId("logout-button").addEventListener("click", async () => {
  try {
    await adminLogout();
  } catch (error) {
    console.error("Logout failed:", error);
    showMessage("Unable to sign out. Please try again.", true);
  }
});

async function initialize() {
  currentAdmin = await requireAdmin();
  if (!currentAdmin) return;

  const name = currentAdmin.profile?.full_name || "Admin";
  byId("admin-avatar").textContent = name.charAt(0).toUpperCase();

  await loadUsers();
}

initialize();
