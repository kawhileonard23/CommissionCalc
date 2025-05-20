
import { requireAuth } from "./authGuard.js";
await requireAuth();

// ---------- DOM ----------
const fileInput  = document.getElementById("fileInput");
const uploadBtn  = document.getElementById("uploadBtn");
const fileStatus = document.getElementById("fileStatus");
const monthSel   = document.getElementById("reportMonth");
const yearInput  = document.getElementById("reportYear");

// ---------- State ----------
let workbookData = null;
let uploaded     = false;

// ---------- 1. Parse XLSX ----------
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) { fileStatus.textContent = "No file selected."; return; }

  const reader = new FileReader();
  reader.onload = ev => {
    const wb   = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rng  = XLSX.utils.decode_range(ws["!ref"]);
    const rows = [];

    for (let r = rng.s.r; r <= rng.e.r; ++r) {
      const row = [];
      for (let c = rng.s.c; c <= rng.e.c; ++c) {
        const ref  = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        let val = "";
        if (cell) val = cell.f ? cell.f.replace(/^=/, "") : cell.v ?? "";
        row.push(val);
      }
      rows.push(row);
    }
    workbookData = rows;
    sessionStorage.setItem("workbookData", JSON.stringify(rows));
    uploaded = true;
    fileStatus.textContent = "File parsed ✓";
  };
  reader.readAsArrayBuffer(file);
});

// ---------- 2. Upload / Generate ----------
uploadBtn.addEventListener("click", async () => {
  console.log("Upload button clicked");           // <- add this
  const month = monthSel.value;
  const year  = yearInput.value.trim();

  if (!uploaded || !month || !year.match(/^\d{4}$/)) {
    alert("Upload a file, select a month, and enter a 4-digit year.");
    return;
  }

  sessionStorage.setItem("reportMonth", month);
  sessionStorage.setItem("reportYear",  year);

  const [companies, rates] = await Promise.all([
    fetchCompanyData(),
    fetchCommissionRates()             // ⬅️ no args, no date filter
  ]);

  console.log("Supabase companies:", companies);
  console.log("Supabase rates:", rates);

  if (!companies.length || !Object.keys(rates).length) {
    alert("Failed to load Supabase data. See console.");
    return;
  }

  const extracted = extractCompanyIncome(workbookData);
  const results   = calculateCommissions(extracted, companies, rates);

  sessionStorage.setItem("commissionResults", JSON.stringify(results));
  window.location.href = "report.html";
});

// ---------- 3. Supabase helpers ----------
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls";
const baseURL = "https://eqgklaeypeoeyywefbes.supabase.co/rest/v1/";

async function supabaseGET(path) {
  const r = await fetch(baseURL + path, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}


function fetchCompanyData() {
  return supabaseGET("companies_change?select=company_name,owner,start_date");
}

// ⬇️ fetch BOTH rates unfiltered: returns { Legacy: 1.5, New: 10 }
async function fetchCommissionRates() {
  const rows = await supabaseGET("commission_values?select=rate_type,value");
  return rows.reduce((obj, { rate_type, value }) => {
    obj[rate_type] = parseFloat(value); return obj;
  }, {});
}

// ---------- 4. Workbook → rows ----------
function extractCompanyIncome(rows) {
  return rows.slice(5).map(r => ({
    companyName: clean(r[0]),
    net: (parseFloat(r[1]) || 0) + (parseFloat(r[2]) || 0)
  })).filter(r => r.companyName);
}

// ---------- 5. Commission calc ----------
function calculateCommissions(extracted, companies, rates) {
  const repMonth = sessionStorage.getItem("reportMonth");
  const repYear  = sessionStorage.getItem("reportYear");
  const totals   = {};

  extracted.forEach(({ companyName, net }) => {
    const comp = companies.find(c => clean(c.company_name) === companyName);
    if (!comp) return;

    const start = new Date(comp.start_date);
    const isNew =
      start.toLocaleString("default", { month: "long" }) === repMonth &&
      String(start.getFullYear()) === repYear;

    const ratePct = isNew ? rates.New : rates.Legacy;
    const owner   = comp.owner;
    totals[owner] = (totals[owner] || 0) + net * (ratePct / 100);
  });
  return totals;
}

const clean = s => String(s||"").toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF]/g,"");
