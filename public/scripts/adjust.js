// public/scripts/adjust.js
import { requireAuth } from "./authGuard.js";
import { supabase }   from "./supabase.js";

await requireAuth();              // block page unless logged-in

// DOM refs
const ratesDiv   = document.getElementById("rates");
const legacyIn   = document.getElementById("legacyInput");
const newIn      = document.getElementById("newInput");
const statusSpan = document.getElementById("status");
const form       = document.getElementById("rateForm");

let legacyRow, newRow;            // cached rows (id + value)

// ---------------------------------------------------------------------------
// 1. Load current rates from commission_values
// ---------------------------------------------------------------------------
async function loadRates() {
  ratesDiv.textContent = "Loading current rates…";

  const { data, error } = await supabase
    .from("commission_values")
    .select("id, rate_type, value");

  if (error) {
    ratesDiv.textContent = error.message;
    return;
  }

  legacyRow = data.find(r => r.rate_type === "Legacy");
  newRow    = data.find(r => r.rate_type === "New");

  ratesDiv.innerHTML = `
    <p>Current Legacy rate: <strong>${legacyRow?.value ?? "?"}%</strong></p>
    <p>Current New rate: <strong>${newRow?.value ?? "?"}%</strong></p>
  `;

  if (legacyRow) legacyIn.value = legacyRow.value;
  if (newRow)    newIn.value    = newRow.value;
}

await loadRates();

// ---------------------------------------------------------------------------
// 2. Handle Save
// ---------------------------------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusSpan.textContent = "Saving…";
  statusSpan.style.color = "black";

  const legacyVal = parseFloat(legacyIn.value);
  const newVal    = parseFloat(newIn.value);

  const updates = [
    supabase
      .from("commission_values")
      .update({ value: legacyVal })
      .eq("id", legacyRow.id),

    supabase
      .from("commission_values")
      .update({ value: newVal })
      .eq("id", newRow.id)
  ];

  const [{ error: err1 }, { error: err2 }] = await Promise.all(updates);

  if (err1 || err2) {
    statusSpan.textContent = (err1 || err2).message;
    statusSpan.style.color = "red";
  } else {
    statusSpan.textContent = "Updated ✓";
    statusSpan.style.color = "green";
    await loadRates();          // refresh display
  }
});
