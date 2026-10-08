import { supabase } from "./supabase.js";

const form = document.querySelector("#reset-password-form");
const passwordInput = document.querySelector("#password");
const confirmInput = document.querySelector("#confirm-password");
const submitButton = document.querySelector("#reset-submit");
const status = document.querySelector("#reset-status");
const intro = document.querySelector("#reset-intro");

let recoverySessionReady = false;

function setStatus(message, type = "") {
  status.textContent = message;
  status.dataset.status = type;
}

function showForm() {
  recoverySessionReady = true;
  form.hidden = false;
  intro.textContent = "Create a new password for your HealthGuide account.";
  setStatus("", "");
}

function showInvalidLink() {
  recoverySessionReady = false;
  form.hidden = true;
  intro.textContent = "This password-reset link is invalid or has expired.";
  setStatus("Request a new reset link from the Forgot Password page.", "error");
}

async function initializeRecovery() {
  // Supabase normally detects the recovery session from the URL automatically.
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Unable to read recovery session:", error);
    showInvalidLink();
    return;
  }

  if (data.session) {
    showForm();
    return;
  }

  // Handle the PASSWORD_RECOVERY event explicitly as a fallback for hosted flows.
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) {
      showForm();
    }
  });

  // Give the recovery callback a short opportunity to establish the session.
  window.setTimeout(async () => {
    if (recoverySessionReady) {
      listener.subscription.unsubscribe();
      return;
    }

    const { data: retry } = await supabase.auth.getSession();
    listener.subscription.unsubscribe();

    if (retry.session) showForm();
    else showInvalidLink();
  }, 1200);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!recoverySessionReady) {
    showInvalidLink();
    return;
  }

  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  if (password.length < 8) {
    setStatus("Your password must contain at least 8 characters.", "error");
    passwordInput.focus();
    return;
  }

  if (password !== confirmPassword) {
    setStatus("The passwords do not match.", "error");
    confirmInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Updating your password...", "loading");

  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Password update failed:", error);
      setStatus("We could not update your password. The reset link may have expired. Request a new one and try again.", "error");
      return;
    }

    form.reset();
    setStatus("Password updated successfully. Redirecting you to sign in...", "success");

    window.setTimeout(() => {
      window.location.href = "./login.html?reset=success";
    }, 1200);
  } catch (error) {
    console.error("Unexpected password update error:", error);
    setStatus("Something went wrong. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

initializeRecovery();
