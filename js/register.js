import { supabase } from "./supabase.js";


const form =
  document.querySelector("#register-form");

const statusElement =
  document.querySelector("#auth-status");

const button =
  document.querySelector("#register-button");


form.addEventListener("submit", async event => {

  event.preventDefault();


  const fullName =
    document.querySelector("#full-name").value.trim();

  const email =
    document.querySelector("#email").value.trim();

  const password =
    document.querySelector("#password").value;

  const confirmPassword =
    document.querySelector("#confirm-password").value;


  statusElement.textContent = "";
  statusElement.className = "auth-status";


  if (password !== confirmPassword) {

    statusElement.textContent =
      "Passwords do not match.";

    statusElement.classList.add("error");

    return;
  }


  button.disabled = true;
  button.textContent = "Creating account...";


  try {

    const { data, error } =
      await supabase.auth.signUp({

        email,

        password,

        options: {
          data: {
            full_name: fullName
          }
        }

      });


    if (error) {
      throw error;
    }


    statusElement.textContent =
      "Account created successfully. Check your email if verification is required.";

    statusElement.classList.add("success");


    form.reset();


    /*
      If Supabase email confirmation is disabled,
      a session may already exist.
    */

    if (data.session) {

      window.location.href =
        "./dashboard.html";

    }

  } catch (error) {

    console.error(error);

    statusElement.textContent =
      getAuthErrorMessage(error);

    statusElement.classList.add("error");

  } finally {

    button.disabled = false;
    button.textContent = "Create Account";

  }

});


function getAuthErrorMessage(error) {

  const message =
    error?.message?.toLowerCase() || "";


  if (message.includes("already registered")) {
    return "An account with this email already exists.";
  }


  if (message.includes("password")) {
    return "Please use a stronger password.";
  }


  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }


  return (
    error?.message ||
    "Something went wrong. Please try again."
  );

}