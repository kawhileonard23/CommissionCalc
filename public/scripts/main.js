// scripts/main.js  (ES-module)

import { supabase } from "./supabase.js";   // supabase.js exports the client

document.addEventListener("DOMContentLoaded", () => {
  const form     = document.getElementById("loginForm");
  const emailEl  = document.getElementById("email");
  const passEl   = document.getElementById("password");
  const errorEl  = document.getElementById("errorMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const { error } = await supabase.auth.signInWithPassword({
      email:    emailEl.value.trim(),
      password: passEl.value
    });

    if (error) {
      errorEl.textContent = error.message;          // Invalid creds
    } else {
      // success → go to landing
      window.location.href = "pages/landing.html";
    }
  });
});
