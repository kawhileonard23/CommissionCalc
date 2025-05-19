// public/scripts/authGuard.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* Initialise the same client used elsewhere */
export const supabase = createClient(
  "https://eqgklaeypeoeyywefbes.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls"
);

/**
 * Call this at the top of any private page.
 * If the visitor has no active Supabase session,
 * they’re bounced to the login page.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // redirect to root‐level login (adjust if path differs)
    window.location.href = "../index.html";
    return null;
  }
  return session;      // you can use session.user.email if needed
}
