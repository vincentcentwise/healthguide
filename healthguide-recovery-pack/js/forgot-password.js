import { supabase } from "./supabase.js";

const form = document.querySelector("#forgot-password-form");
const emailInput = document.querySelector("#email");
const submitButton = document.querySelector("#forgot-submit");
const status = document.querySelector("#forgot-status");

function setStatus(message, type = "") {
  status.textContent = message;
  status.dataset.status = type;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    setStatus("Enter your email address.", "error");
    emailInput.focus();
    return;
  }

  if (!emailInput.checkValidity()) {
    setStatus("Enter a valid email address.", "error");
    emailInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Sending reset instructions...", "loading");

  try {
    const redirectTo = new URL("./reset-password.html", window.location.href).href;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    // Deliberately use the same success message whether or not the account exists.
    // This avoids exposing which email addresses are registered.
    if (error) {
      console.error("Password reset request failed:", error);
      setStatus("We could not process the request right now. Please try again shortly.", "error");
      return;
    }

    setStatus(
      "If an account exists for that email, reset instructions have been sent. Check your inbox and spam folder.",
      "success"
    );
    form.reset();
  } catch (error) {
    console.error("Unexpected password reset error:", error);
    setStatus("Something went wrong. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
