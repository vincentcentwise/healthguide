import { supabase } from "./supabase.js";

import {
  requireAuth,
  logout
} from "./auth-guard.js";


const userName =
  document.querySelector("#user-name");

const favoriteCount =
  document.querySelector("#favorite-count");

const historyCount =
  document.querySelector("#history-count");

const logoutButton =
  document.querySelector("#logout-button");


async function loadDashboard() {

  const session =
    await requireAuth();


  if (!session) {
    return;
  }


  const user =
    session.user;


  await loadProfile(user.id);

  await loadStatistics(user.id);

  await loadRecentHistory(user.id);

  await loadRecentFavorites(user.id);

}


async function loadProfile(userId) {

  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    return;
  }


  const name =
    data?.full_name?.trim();


  userName.textContent =
    name || "there";
}


async function loadStatistics(userId) {

  const [
    favorites,
    history
  ] = await Promise.all([

    supabase
      .from("favorites")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("user_id", userId),

    supabase
      .from("search_history")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("user_id", userId)

  ]);


  favoriteCount.textContent =
    favorites.count ?? 0;


  historyCount.textContent =
    history.count ?? 0;
}


async function loadRecentHistory(userId) {

  const container =
    document.querySelector("#recent-searches");


  const {
    data,
    error
  } = await supabase
    .from("search_history")
    .select(
      "id, search_term, search_type, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false
    })
    .limit(5);


  if (error) {

    console.error(error);

    return;
  }


  if (!data?.length) {
    return;
  }


  container.innerHTML =
    data.map(item => {

      const date =
        new Date(
          item.created_at
        ).toLocaleDateString();

      return `
        <article class="activity-item">

          <div>

            <h3>
              ${escapeHTML(item.search_term)}
            </h3>

            <p>
              ${escapeHTML(
                item.search_type || "Search"
              )}
              · ${date}
            </p>

          </div>

        </article>
      `;

    }).join("");
}


async function loadRecentFavorites(userId) {

  const container =
    document.querySelector("#recent-favorites");


  const {
    data,
    error
  } = await supabase
    .from("favorites")
    .select(
      "id, title, resource_type, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false
    })
    .limit(5);


  if (error) {

    console.error(error);

    return;
  }


  if (!data?.length) {
    return;
  }


  container.innerHTML =
    data.map(item => {

      const date =
        new Date(
          item.created_at
        ).toLocaleDateString();

      return `
        <article class="activity-item">

          <div>

            <h3>
              ${escapeHTML(item.title)}
            </h3>

            <p>
              ${escapeHTML(
                item.resource_type || "Resource"
              )}
              · ${date}
            </p>

          </div>

          <a href="./favorites.html">
            View
          </a>

        </article>
      `;

    }).join("");
}


logoutButton?.addEventListener(
  "click",
  async () => {

    logoutButton.disabled = true;

    logoutButton.textContent =
      "Signing out...";

    try {

      await logout();

    } catch (error) {

      console.error(error);

      logoutButton.disabled = false;

      logoutButton.textContent =
        "Logout";
    }

  }
);


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


loadDashboard();