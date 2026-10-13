
import { supabase } from "./supabase.js";
import { requireAdmin, adminLogout } from "./admin-guard.js";

const tbody = document.querySelector("#categories-table-body");
const searchInput = document.querySelector("#category-search");
const statusFilter = document.querySelector("#category-status-filter");
const dialog = document.querySelector("#category-dialog");
const form = document.querySelector("#category-form");
const message = document.querySelector("#catalog-message");
const saveButton = document.querySelector("#save-category");

let currentAdmin = null;
let categories = [];
let saving = false;

const $ = id => document.getElementById(id);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
  message.classList.remove("error");
}

function categoryStatus(category) {
  return category.status === "inactive" ? "inactive" : "active";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(date);
}

function updateStats() {
  $("total-categories").textContent = categories.length;
  $("active-categories").textContent =
    categories.filter(c => categoryStatus(c) === "active").length;
  $("inactive-categories").textContent =
    categories.filter(c => categoryStatus(c) === "inactive").length;
}

function renderCategories() {
  const term = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;

  const visible = categories.filter(category => {
    const matchesText =
      (category.name || "").toLowerCase().includes(term) ||
      (category.slug || "").toLowerCase().includes(term);

    const matchesStatus =
      filter === "all" || categoryStatus(category) === filter;

    return matchesText && matchesStatus;
  });

  $("category-results-count").textContent =
    `${visible.length} categor${visible.length === 1 ? "y" : "ies"} shown`;

  if (!visible.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="table-state">
        No categories found. Create a category or change your filters.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = visible.map(category => {
    const status = categoryStatus(category);

    return `
      <tr>
        <td>
          <span class="category-name">${escapeHTML(category.name)}</span>
          <span class="category-id">${escapeHTML(String(category.id).slice(0, 8))}…</span>
        </td>
        <td><span class="category-slug">${escapeHTML(category.slug || "—")}</span></td>
        <td>
          <span class="category-pill category-${status}">
            ${status === "active" ? "Active" : "Inactive"}
          </span>
        </td>
        <td>${escapeHTML(formatDate(category.created_at))}</td>
        <td>
          <div class="category-actions">
            <button class="category-action" type="button"
              data-action="edit" data-id="${escapeHTML(category.id)}">
              Edit
            </button>
            <button class="category-action" type="button"
              data-action="toggle" data-id="${escapeHTML(category.id)}">
              ${status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

async function loadCategories() {
  clearMessage();
  tbody.innerHTML =
    `<tr><td colspan="5" class="table-state">Loading categories…</td></tr>`;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, status, created_at, updated_at")
      .order("name", { ascending: true });

    if (error) throw error;

    categories = data || [];
    updateStats();
    renderCategories();
  } catch (error) {
    console.error("Unable to load categories:", error);
    tbody.innerHTML =
      `<tr><td colspan="5" class="table-state">Could not load categories.</td></tr>`;

    showMessage(
      error.message || "Unable to load categories. Check the table schema and permissions.",
      true
    );
  }
}

function openNewCategory() {
  form.reset();
  $("category-id").value = "";
  $("category-status").value = "active";
  $("category-dialog-title").textContent = "New category";
  $("category-form-error").hidden = true;
  $("category-name").readOnly = false;
  dialog.showModal();
  $("category-name").focus();
}

function openEditCategory(category) {
  form.reset();
  $("category-id").value = category.id;
  $("category-name").value = category.name || "";
  $("category-slug").value = category.slug || "";
  $("category-status").value = categoryStatus(category);
  $("category-dialog-title").textContent = "Edit category";
  $("category-form-error").hidden = true;
  $("category-name").readOnly = false;
  dialog.showModal();
  $("category-name").focus();
}

$("category-name").addEventListener("input", () => {
  const name = $("category-name").value;
  const slugInput = $("category-slug");

  if (!slugInput.dataset.edited) {
    slugInput.value = slugify(name);
  }
});

$("category-slug").addEventListener("input", () => {
  $("category-slug").dataset.edited = "true";
});

$("add-category-button").addEventListener("click", openNewCategory);

$("close-category-dialog").addEventListener("click", () => dialog.close());
$("cancel-category").addEventListener("click", () => dialog.close());
$("refresh-categories").addEventListener("click", loadCategories);

searchInput.addEventListener("input", renderCategories);
statusFilter.addEventListener("change", renderCategories);

tbody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const category = categories.find(item => String(item.id) === button.dataset.id);
  if (!category) return;

  if (button.dataset.action === "edit") {
    openEditCategory(category);
    return;
  }

  if (button.dataset.action === "toggle") {
    const nextStatus =
      categoryStatus(category) === "active" ? "inactive" : "active";

    const action = nextStatus === "inactive" ? "deactivate" : "activate";

    if (!window.confirm(
      `Are you sure you want to ${action} "${category.name}"?`
    )) return;

    clearMessage();

    try {
      const { data, error } = await supabase
        .from("categories")
        .update({ status: nextStatus })
        .eq("id", category.id)
        .select("id, name, slug, status, created_at, updated_at")
        .single();

      if (error) throw error;

      categories = categories.map(item =>
        item.id === category.id ? data : item
      );

      updateStats();
      renderCategories();
      showMessage(`Category "${data.name}" is now ${nextStatus}.`);
    } catch (error) {
      console.error("Unable to update category:", error);
      showMessage(error.message || "Unable to update category.", true);
    }
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (saving) return;

  const id = $("category-id").value;
  const name = $("category-name").value.trim();
  const slug = slugify($("category-slug").value);
  const status = $("category-status").value;
  const formError = $("category-form-error");

  formError.hidden = true;
  clearMessage();

  if (!name || !slug) {
    formError.textContent = "Enter a category name and a valid slug.";
    formError.hidden = false;
    return;
  }

  const duplicate = categories.find(category =>
    category.slug?.toLowerCase() === slug.toLowerCase() &&
    String(category.id) !== id
  );

  if (duplicate) {
    formError.textContent = "That slug is already being used. Choose another one.";
    formError.hidden = false;
    return;
  }

  saving = true;
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  try {
    let result;

    if (id) {
      result = await supabase
        .from("categories")
        .update({ name, slug, status })
        .eq("id", id)
        .select("id, name, slug, status, created_at, updated_at")
        .single();
    } else {
      result = await supabase
        .from("categories")
        .insert({ name, slug, status })
        .select("id, name, slug, status, created_at, updated_at")
        .single();
    }

    if (result.error) throw result.error;

    const saved = result.data;

    if (id) {
      categories = categories.map(category =>
        String(category.id) === id ? saved : category
      );
    } else {
      categories.push(saved);
    }

    categories.sort((a, b) => a.name.localeCompare(b.name));

    updateStats();
    renderCategories();
    dialog.close();

    showMessage(
      id
        ? `Category "${saved.name}" updated successfully.`
        : `Category "${saved.name}" created successfully.`
    );
  } catch (error) {
    console.error("Unable to save category:", error);
    formError.textContent =
      error.message || "Unable to save this category.";
    formError.hidden = false;
  } finally {
    saving = false;
    saveButton.disabled = false;
    saveButton.textContent = "Save category";
  }
});

$("logout-button").addEventListener("click", async () => {
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
  await loadCategories();
}

initialize();
