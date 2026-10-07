import { supabase } from "./supabase.js";


export async function requireAuth() {

  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();


  if (!session) {

    const currentPage =
      window.location.pathname
        .split("/")
        .pop();

    window.location.href =
      `./login.html?redirect=${encodeURIComponent(currentPage)}`;

    return null;
  }


  return session;
}


export async function getCurrentUser() {

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();


  return user;
}


export async function logout() {

  const {
    error
  } = await supabase.auth.signOut();


  if (error) {
    throw error;
  }


  window.location.href =
    "./index.html";
}