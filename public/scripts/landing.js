// public/scripts/landing.js
import { requireAuth, supabase } from "./authGuard.js";  // authGuard already exports supabase

// 1  Block the page unless the user is signed-in
await requireAuth();   // redirects to ../index.html if no session

// 2  Wire the Log-out button (if it exists on this page)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../index.html";
  });
}
