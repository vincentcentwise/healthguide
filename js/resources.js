import { supabase } from "./supabase.js";
import {
  requireAdmin,
  adminLogout
} from "./admin-guard.js";


// ============================================
// DOM ELEMENTS
// ============================================

const resourcesTable =
  document.getElementById("resourcesTable");

const resourceSearch =
  document.getElementById("resourceSearch");

const typeFilter =
  document.getElementById("typeFilter");

const statusFilter =
  document.getElementById("statusFilter");

const categoryFilter =
  document.getElementById("categoryFilter");

const totalResources =
  document.getElementById("totalResources");

const publishedResources =
  document.getElementById("publishedResources");

const draftResources =
  document.getElementById("draftResources");

const archivedResources =
  document.getElementById("archivedResources");

const resourceEmptyState =
  document.getElementById("resourceEmptyState");

const resourceErrorState =
  document.getElementById("resourceErrorState");

const resourceErrorMessage =
  document.getElementById("resourceErrorMessage");

const retryResourcesButton =
  document.getElementById("retryResourcesButton");

const newResourceButton =
  document.getElementById("newResourceButton");

const resourceModal =
  document.getElementById("resourceModal");

const modalBackdrop =
  document.getElementById("modalBackdrop");

const closeResourceModal =
  document.getElementById("closeResourceModal");

const cancelResourceButton =
  document.getElementById("cancelResourceButton");

const resourceForm =
  document.getElementById("resourceForm");

const resourceModalTitle =
  document.getElementById("resourceModalTitle");

const resourceId =
  document.getElementById("resourceId");

const resourceTitle =
  document.getElementById("resourceTitle");

const resourceSlug =
  document.getElementById("resourceSlug");

const resourceType =
  document.getElementById("resourceType");

const resourceCategory =
  document.getElementById("resourceCategory");

const resourceSummary =
  document.getElementById("resourceSummary");

const resourceContent =
  document.getElementById("resourceContent");

const resourceStatus =
  document.getElementById("resourceStatus");

const resourceFormError =
  document.getElementById("resourceFormError");

const saveResourceButton =
  document.getElementById("saveResourceButton");

const logoutButton =
  document.getElementById("logoutButton");

const adminName =
  document.getElementById("adminName");

const adminAvatar =
  document.getElementById("adminAvatar");

const menuToggle =
  document.getElementById("menuToggle");

const adminSidebar =
  document.getElementById("adminSidebar");


// ============================================
// STATE
// ============================================

let currentAdmin = null;

let resources = [];

let categories = [];


// ============================================
// HELPERS
// ============================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  const date = new Date(value);

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


function formatResourceType(type) {

  const labels = {
    first_aid: "First Aid",
    healthcare: "Healthcare",
    article: "Article",
    guide: "Guide"
  };

  return labels[type] || type || "Unknown";
}


function slugify(value) {

  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function showFormError(message) {

  resourceFormError.textContent = message;

  resourceFormError.hidden = false;
}


function hideFormError() {

  resourceFormError.textContent = "";

  resourceFormError.hidden = true;
}


function showError(message) {

  resourceErrorMessage.textContent =
    message;

  resourceErrorState.hidden = false;
}


function hideError() {

  resourceErrorState.hidden = true;
}


// ============================================
// ADMIN DISPLAY
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
// LOAD CATEGORIES
// ============================================

async function loadCategories() {

  const {
    data,
    error
  } = await supabase
    .from("categories")
    .select(`
      id,
      name,
      slug,
      status
    `)
    .order("name", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  categories = data || [];

  populateCategorySelects();
}


// ============================================
// CATEGORY SELECTS
// ============================================

function populateCategorySelects() {

  const activeCategories =
    categories.filter(
      category =>
        !category.status ||
        category.status === "active"
    );


  const currentFilter =
    categoryFilter.value;

  categoryFilter.innerHTML = `
    <option value="all">
      All Categories
    </option>
  `;

  activeCategories.forEach(category => {

    categoryFilter.insertAdjacentHTML(
      "beforeend",
      `
        <option value="${escapeHTML(
          category.name
        )}">
          ${escapeHTML(category.name)}
        </option>
      `
    );

  });


  const currentResourceCategory =
    resourceCategory.value;

  resourceCategory.innerHTML = `
    <option value="">
      Select category
    </option>
  `;

  activeCategories.forEach(category => {

    resourceCategory.insertAdjacentHTML(
      "beforeend",
      `
        <option value="${escapeHTML(
          category.name
        )}">
          ${escapeHTML(category.name)}
        </option>
      `
    );

  });


  if (currentFilter) {
    categoryFilter.value =
      currentFilter;
  }

  if (currentResourceCategory) {
    resourceCategory.value =
      currentResourceCategory;
  }

}


// ============================================
// LOAD RESOURCES
// ============================================

async function loadResources() {

  hideError();

  resourcesTable.innerHTML = `
    <tr>
      <td
        colspan="6"
        class="admin-table-loading"
      >
        Loading resources...
      </td>
    </tr>
  `;

  try {

    const {
      data,
      error
    } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        slug,
        resource_type,
        category,
        summary,
        content,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at
      `)
      .order("updated_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    resources = data || [];

    updateStatistics();

    renderResources();

  } catch (error) {

    console.error(
      "Unable to load resources:",
      error
    );

    resourcesTable.innerHTML = "";

    showError(
      error.message ||
      "Unable to load resources."
    );

  }

}


// ============================================
// STATISTICS
// ============================================

function updateStatistics() {

  totalResources.textContent =
    resources.length.toLocaleString();

  publishedResources.textContent =
    resources.filter(
      resource =>
        resource.status === "published"
    ).length.toLocaleString();

  draftResources.textContent =
    resources.filter(
      resource =>
        resource.status === "draft"
    ).length.toLocaleString();

  archivedResources.textContent =
    resources.filter(
      resource =>
        resource.status === "archived"
    ).length.toLocaleString();
}


// ============================================
// FILTER
// ============================================

function getFilteredResources() {

  const search =
    resourceSearch.value
      .trim()
      .toLowerCase();

  const type =
    typeFilter.value;

  const status =
    statusFilter.value;

  const category =
    categoryFilter.value;


  return resources.filter(resource => {

    // Search

    if (search) {

      const searchable =
        [
          resource.title,
          resource.slug,
          resource.summary,
          resource.category,
          resource.resource_type
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      if (
        !searchable.includes(search)
      ) {
        return false;
      }

    }


    // Type

    if (
      type !== "all" &&
      resource.resource_type !== type
    ) {
      return false;
    }


    // Status

    if (
      status !== "all" &&
      resource.status !== status
    ) {
      return false;
    }


    // Category

    if (
      category !== "all" &&
      resource.category !== category
    ) {
      return false;
    }


    return true;

  });

}


// ============================================
// STATUS BADGE
// ============================================

function statusBadge(status) {

  const classes = {
    published: "success",
    draft: "warning",
    archived: "neutral"
  };

  const labels = {
    published: "Published",
    draft: "Draft",
    archived: "Archived"
  };

  return `
    <span class="admin-badge ${
      classes[status] || "neutral"
    }">
      ${
        labels[status] ||
        escapeHTML(status)
      }
    </span>
  `;
}


// ============================================
// RENDER RESOURCES
// ============================================

function renderResources() {

  const filtered =
    getFilteredResources();


  if (!filtered.length) {

    resourcesTable.innerHTML = "";

    resourceEmptyState.hidden = false;

    return;

  }


  resourceEmptyState.hidden = true;


  resourcesTable.innerHTML =
    filtered.map(resource => {

      return `
        <tr>

          <td>

            <div class="resource-table-title">

              <strong>
                ${escapeHTML(
                  resource.title
                )}
              </strong>

              <span>
                ${escapeHTML(
                  resource.slug || ""
                )}
              </span>

            </div>

          </td>


          <td>
            <span class="resource-type">
              ${escapeHTML(
                formatResourceType(
                  resource.resource_type
                )
              )}
            </span>
          </td>


          <td>
            ${
              escapeHTML(
                resource.category || "Uncategorized"
              )
            }
          </td>


          <td>
            ${statusBadge(
              resource.status
            )}
          </td>


          <td>
            <time datetime="${escapeHTML(
              resource.updated_at || ""
            )}">
              ${escapeHTML(
                formatDate(
                  resource.updated_at
                )
              )}
            </time>
          </td>


          <td>

            <div class="resource-actions">

              <button
                type="button"
                class="admin-action-button"
                data-action="edit"
                data-id="${escapeHTML(
                  resource.id
                )}"
              >
                Edit
              </button>

              ${
                resource.status === "published"

                ? `
                  <button
                    type="button"
                    class="admin-action-button warning"
                    data-action="archive"
                    data-id="${escapeHTML(
                      resource.id
                    )}"
                  >
                    Archive
                  </button>
                `

                : resource.status === "archived"

                ? `
                  <button
                    type="button"
                    class="admin-action-button success"
                    data-action="restore"
                    data-id="${escapeHTML(
                      resource.id
                    )}"
                  >
                    Restore
                  </button>
                `

                : `
                  <button
                    type="button"
                    class="admin-action-button success"
                    data-action="publish"
                    data-id="${escapeHTML(
                      resource.id
                    )}"
                  >
                    Publish
                  </button>
                `
              }

            </div>

          </td>

        </tr>
      `;

    })
    .join("");
}


// ============================================
// OPEN MODAL
// ============================================

function openResourceModal(
  resource = null
) {

  hideFormError();

  resourceForm.reset();

  resourceId.value = "";


  if (resource) {

    resourceModalTitle.textContent =
      "Edit Resource";

    resourceId.value =
      resource.id || "";

    resourceTitle.value =
      resource.title || "";

    resourceSlug.value =
      resource.slug || "";

    resourceType.value =
      resource.resource_type || "";

    resourceCategory.value =
      resource.category || "";

    resourceSummary.value =
      resource.summary || "";

    resourceStatus.value =
      resource.status || "draft";


    if (
      resource.content &&
      typeof resource.content === "object"
    ) {

      resourceContent.value =
        JSON.stringify(
          resource.content,
          null,
          2
        );

    } else {

      resourceContent.value =
        resource.content || "";

    }

  } else {

    resourceModalTitle.textContent =
      "Create Resource";

    resourceStatus.value =
      "draft";

  }


  resourceModal.hidden = false;

  document.body.classList.add(
    "modal-open"
  );


  resourceTitle.focus();
}


// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {

  resourceModal.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  hideFormError();
}


// ============================================
// GET RESOURCE
// ============================================

function getResourceById(id) {

  return resources.find(
    resource =>
      String(resource.id) === String(id)
  );

}


// ============================================
// CREATE / UPDATE RESOURCE
// ============================================

async function saveResource(event) {

  event.preventDefault();

  hideFormError();


  const title =
    resourceTitle.value.trim();

  const slug =
    resourceSlug.value.trim() ||
    slugify(title);

  const type =
    resourceType.value;

  const category =
    resourceCategory.value || null;

  const summary =
    resourceSummary.value.trim();

  const status =
    resourceStatus.value;


  if (!title) {

    showFormError(
      "Resource title is required."
    );

    return;
  }


  if (!type) {

    showFormError(
      "Please select a resource type."
    );

    return;
  }


  if (!summary) {

    showFormError(
      "Resource summary is required."
    );

    return;
  }


  // ------------------------------------------
  // Validate JSON
  // ------------------------------------------

  let content = {};

  const rawContent =
    resourceContent.value.trim();

  if (rawContent) {

    try {

      content =
        JSON.parse(rawContent);

    } catch {

      showFormError(
        "Content must contain valid JSON."
      );

      return;

    }

  }


  saveResourceButton.disabled = true;

  saveResourceButton.textContent =
    "Saving...";


  try {

    const id =
      resourceId.value.trim();


    // ========================================
    // UPDATE
    // ========================================

    if (id) {

      const {
        error
      } = await supabase
        .from("resources")
        .update({
          title,
          slug,
          resource_type: type,
          category,
          summary,
          content,
          status,
          updated_by:
            currentAdmin.user.id
        })
        .eq("id", id);

      if (error) {
        throw error;
      }


      await createAuditLog({
        action: "update",
        resourceType: "resource",
        resourceId: id,
        metadata: {
          title,
          status
        }
      });


      if (status === "published") {

        await createAuditLog({
          action: "publish",
          resourceType: "resource",
          resourceId: id,
          metadata: {
            title
          }
        });

      }


      if (status === "archived") {

        await createAuditLog({
          action: "archive",
          resourceType: "resource",
          resourceId: id,
          metadata: {
            title
          }
        });

      }


      alert(
        "Resource updated successfully."
      );

    }


    // ========================================
    // CREATE
    // ========================================

    else {

      const {
        data,
        error
      } = await supabase
        .from("resources")
        .insert({
          title,
          slug,
          resource_type: type,
          category,
          summary,
          content,
          status,
          created_by:
            currentAdmin.user.id,
          updated_by:
            currentAdmin.user.id
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }


      await createAuditLog({
        action: "create",
        resourceType: "resource",
        resourceId: data.id,
        metadata: {
          title,
          status
        }
      });


      if (status === "published") {

        await createAuditLog({
          action: "publish",
          resourceType: "resource",
          resourceId: data.id,
          metadata: {
            title
          }
        });

      }


      alert(
        "Resource created successfully."
      );

    }


    closeModal();

    await loadResources();

  } catch (error) {

    console.error(
      "Unable to save resource:",
      error
    );

    showFormError(
      error.message ||
      "Unable to save resource."
    );

  } finally {

    saveResourceButton.disabled =
      false;

    saveResourceButton.textContent =
      "Save Resource";

  }

}


// ============================================
// CHANGE RESOURCE STATUS
// ============================================

async function changeResourceStatus(
  id,
  newStatus
) {

  const resource =
    getResourceById(id);

  if (!resource) {
    return;
  }


  const messages = {

    published:
      "Publish this resource?",

    archived:
      "Archive this resource?",

    draft:
      "Move this resource back to draft?"

  };


  const confirmed =
    window.confirm(
      messages[newStatus] ||
      "Change resource status?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } = await supabase
      .from("resources")
      .update({
        status: newStatus,
        updated_by:
          currentAdmin.user.id
      })
      .eq("id", id);

    if (error) {
      throw error;
    }


    await createAuditLog({
      action:
        newStatus === "published"
          ? "publish"
          : newStatus === "archived"
            ? "archive"
            : "update",

      resourceType: "resource",

      resourceId: id,

      metadata: {
        title: resource.title,
        status: newStatus
      }

    });


    await loadResources();

  } catch (error) {

    console.error(
      "Unable to change resource status:",
      error
    );

    alert(
      error.message ||
      "Unable to change resource status."
    );

  }

}


// ============================================
// AUDIT LOG
// ============================================

async function createAuditLog({
  action,
  resourceType,
  resourceId,
  metadata = {}
}) {

  const {
    error
  } = await supabase
    .from("audit_logs")
    .insert({
      admin_id:
        currentAdmin.user.id,

      action,

      resource_type:
        resourceType,

      resource_id:
        String(resourceId),

      metadata
    });


  if (error) {

    console.error(
      "Audit log failed:",
      error
    );

    // We deliberately do not stop the
    // resource operation because audit
    // logging should not make the CMS
    // unusable.

  }

}


// ============================================
// TABLE ACTIONS
// ============================================

resourcesTable.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) {
      return;
    }


    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


    const resource =
      getResourceById(id);


    if (!resource) {
      return;
    }


    if (action === "edit") {

      openResourceModal(
        resource
      );

      return;
    }


    if (action === "publish") {

      await changeResourceStatus(
        id,
        "published"
      );

      return;
    }


    if (action === "archive") {

      await changeResourceStatus(
        id,
        "archived"
      );

      return;
    }


    if (action === "restore") {

      await changeResourceStatus(
        id,
        "draft"
      );

    }

  }
);


// ============================================
// AUTO SLUG
// ============================================

resourceTitle.addEventListener(
  "input",
  () => {

    if (
      !resourceId.value &&
      !resourceSlug.value
    ) {

      resourceSlug.value =
        slugify(
          resourceTitle.value
        );

    }

  }
);


// ============================================
// FILTER EVENTS
// ============================================

resourceSearch.addEventListener(
  "input",
  renderResources
);

typeFilter.addEventListener(
  "change",
  renderResources
);

statusFilter.addEventListener(
  "change",
  renderResources
);

categoryFilter.addEventListener(
  "change",
  renderResources
);


// ============================================
// MODAL EVENTS
// ============================================

newResourceButton.addEventListener(
  "click",
  () => openResourceModal()
);

closeResourceModal.addEventListener(
  "click",
  closeModal
);

cancelResourceButton.addEventListener(
  "click",
  closeModal
);

modalBackdrop.addEventListener(
  "click",
  closeModal
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !resourceModal.hidden
    ) {

      closeModal();

    }

  }
);


// ============================================
// LOGOUT
// ============================================

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
// MOBILE MENU
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
// RETRY
// ============================================

retryResourcesButton.addEventListener(
  "click",
  loadResources
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

  currentAdmin =
    admin;

  displayAdmin(
    admin.profile
  );


  try {

    await loadCategories();

  } catch (error) {

    console.error(
      "Unable to load categories:",
      error
    );

  }


  await loadResources();

}


initialize();