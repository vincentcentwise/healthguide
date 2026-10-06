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

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email,
        password

      });


    if (error) {
      throw error;
    }


    if (!data.session) {

      throw new Error(
        "Unable to establish a session."
      );

    }


    window.location.href =
      "./dashboard.html";


  } catch (error) {

    console.error(error);

    statusElement.textContent =
      error?.message ||
      "Unable to sign in. Please check your email and password.";

    statusElement.classList.add("error");


  } finally {

    button.disabled = false;
    button.textContent = "Sign In";

  }

});