import { supabase } from "./supabase.js";


const form =
  document.querySelector("#login-form");

const statusElement =
  document.querySelector("#auth-status");

const button =
  document.querySelector("#login-button");


form.addEventListener("submit", async event => {

  event.preventDefault();


  const email =
    document.querySelector("#email").value.trim();

  const password =
    document.querySelector("#password").value;


  statusElement.textContent = "";
  statusElement.className = "auth-status";


  button.disabled = true;
  button.textContent = "Signing in...";


  try {

    // ============================================
    // 1. SIGN IN WITH SUPABASE AUTH
    // ============================================

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email,
        password

      });


    if (error) {
      throw error;
    }


    if (!data.session || !data.user) {

      throw new Error(
        "Unable to establish a session."
      );

    }


    const user = data.user;


    // ============================================
    // 2. GET USER PROFILE
    // ============================================

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("profiles")
      .select("id, full_name, role, status")
      .eq("id", user.id)
      .single();


    if (profileError) {

      console.error(
        "Profile lookup failed:",
        profileError
      );

      throw new Error(
        "Your account profile could not be loaded. Please contact the administrator."
      );

    }


    if (!profile) {

      throw new Error(
        "No profile was found for this account. Please contact the administrator."
      );

    }


    // ============================================
    // 3. CHECK ACCOUNT STATUS
    // ============================================

    if (
      profile.status &&
      profile.status !== "active"
    ) {

      await supabase.auth.signOut();

      throw new Error(
        "Your account is currently suspended or inactive. Please contact the administrator."
      );

    }


    // ============================================
    // 4. ADMIN REDIRECT
    // ============================================

    if (profile.role === "admin") {

      console.log(
        "Admin login detected:",
        profile
      );

      window.location.href =
        "./admin/index.html";

      return;

    }


    // ============================================
    // 5. NORMAL USER REDIRECT
    // ============================================

    window.location.href =
      "./dashboard.html";


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    statusElement.textContent =
      error?.message ||
      "Unable to sign in. Please check your email and password.";

    statusElement.classList.add("error");


  } finally {

    button.disabled = false;
    button.textContent = "Sign In";

  }

});