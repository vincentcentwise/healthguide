import { supabase } from "./supabase.js";

/**
 * Require the current user to be authenticated
 * and have the admin role.
 */
export async function requireAdmin() {
  // Check authentication
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    window.location.href =
      "../login.html?redirect=admin/index.html";

    return null;
  }

  // Get the user's profile and role
  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("id, full_name, role, status")
    .eq("id", session.user.id)
    .single();

  // Profile lookup failed
  if (profileError || !profile) {
    console.error("Unable to load admin profile:", profileError);

    await supabase.auth.signOut();

    window.location.href = "../login.html";

    return null;
  }

  // User is not an administrator
  if (profile.role !== "admin") {
    window.location.href = "../dashboard.html";

    return null;
  }

  // Suspended/deleted accounts cannot access admin
  if (profile.status && profile.status !== "active") {
    await supabase.auth.signOut();

    window.location.href = "../login.html";

    return null;
  }

  return {
    session,
    user: session.user,
    profile
  };
}


/**
 * Sign out the administrator.
 */
export async function adminLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Admin logout failed:", error);
    throw error;
  }

  window.location.href = "../index.html";
}