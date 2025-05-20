import { requireAuth, supabase } from "./authGuard.js";
await requireAuth();                                    // redirect if not logged-in

/* ── DOM refs ─────────────────────────────────────────────── */
const fileInput  = document.getElementById("fileInput");
const compareBtn = document.getElementById("compareBtn");
const syncBtn    = document.getElementById("syncBtn");
const statusEl   = document.getElementById("status");
const tableBody  = document.querySelector("#previewTable tbody");
const previewWrap = document.getElementById("previewWrapper"); 

/* ── State ────────────────────────────────────────────────── */
let csvRows = [];          // [{company_name, owner, start_date} …]

/* ── Helpers ──────────────────────────────────────────────── */
const clean = s => String(s || "")
  .toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF]/g, "");

/* ── 1.  Handle file selection ────────────────────────────── */
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) { statusEl.textContent = "No file selected."; return; }

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: res => handleRawRows(res.data),
      error: err => statusEl.textContent = err.message
    });
  } else if (ext === "xlsx") {
    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      /* Convert the sheet to CSV text, then feed PapaParse */
      const csvText = XLSX.utils.sheet_to_csv(ws);
      const res = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      if (res.errors.length) {
        statusEl.textContent = res.errors[0].message;
      } else {
        handleRawRows(res.data);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    statusEl.textContent = "Unsupported file type.";
  }
});

/* Parse, trim & dedupe rows */
function handleRawRows(rawRows) {
    csvRows = rawRows.map(r => {
        // grab & clean the date
        let rawDate = (r["Contract Start Date cf_691706"] || "").split(" ")[0].trim();
        if (!rawDate) rawDate = "2018-01-01";      // ← default when blank
      
        return {
          company_name: r["Name"]?.trim() || "",
          owner:        r["Owned By"]?.trim() || "",
          start_date:   rawDate
        };
      });
      

  /* Deduplicate within the uploaded file */
  const seen = new Set();
  csvRows = csvRows.filter(r => {
    const key = clean(r.company_name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  statusEl.textContent = `Parsed ${csvRows.length} unique companies.`;
  syncBtn.disabled = true;
  previewWrap.classList.add("hidden");
}

/* ── 2.  Compare with Supabase ────────────────────────────── */
compareBtn.addEventListener("click", async () => {
  if (!csvRows.length) { alert("Choose a file first."); return; }

  statusEl.textContent = "Fetching existing companies…";
  try {
    const { data, error } = await supabase
      .from("companies_change")
      .select("company_name");
    if (error) throw error;

    const existing = new Set(data.map(d => clean(d.company_name)));
    const newRows  = csvRows.filter(r => !existing.has(clean(r.company_name)));

    /* Preview */
    tableBody.innerHTML = "";
    newRows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${r.company_name}</td><td>${r.owner}</td><td>${r.start_date}</td>`;
      tableBody.appendChild(tr);
    });

    previewWrap.classList.toggle("hidden", newRows.length === 0);
    statusEl.textContent = newRows.length
      ? `${newRows.length} new companies detected. Click Sync to insert.`
      : "No new companies to add ✔︎";

    syncBtn.dataset.rows = JSON.stringify(newRows);
    syncBtn.disabled = newRows.length === 0;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error fetching companies.";
  }
});

/* ── 3.  Upsert rows ─────────────────────────────────────── */
syncBtn.addEventListener("click", async () => {
  const newRows = JSON.parse(syncBtn.dataset.rows || "[]");
  if (!newRows.length) return;

  statusEl.textContent = "Inserting…";
  syncBtn.disabled = true;

  const { error } = await supabase
    .from("companies_change")
    .insert(newRows, { ignoreDuplicates: true });

  if (error) {
    console.error(error);
    statusEl.textContent = error.message;
    syncBtn.disabled = false;
  } else {
    statusEl.textContent = `Inserted ${newRows.length} companies ✔︎`;
  }
});
