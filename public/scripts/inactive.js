import { requireAuth } from "./authGuard.js";
await requireAuth();

// ---------- DOM Elements ----------
const fileInput = document.getElementById("fileInput");
const viewBtn = document.getElementById("viewBtn");

// ---------- State ----------
let workbookData = null;
let fileUploaded = false;

// ---------- File Upload Handler ----------
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) { 
    fileUploaded = false;
    return; 
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rng = XLSX.utils.decode_range(ws["!ref"]);
    const rows = [];

    for (let r = rng.s.r; r <= rng.e.r; ++r) {
      const row = [];
      for (let c = rng.s.c; c <= rng.e.c; ++c) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref];
        let val = "";
        if (cell) {
          // Prioritize calculated value (v) over formula (f) for proper number extraction
          val = cell.v ?? (cell.f ? cell.f.replace(/^=/, "") : "");
        }
        row.push(val);
      }
      rows.push(row);
    }
    
    workbookData = rows;
    fileUploaded = true;
    console.log("File parsed successfully", rows.length, "rows");
    
    // Debug: log some sample rows from row 7 onwards
    console.log("Sample data from row 7-12:");
    for (let i = 6; i < Math.min(12, rows.length); i++) {
      console.log(`Row ${i+1}:`, `Customer: "${rows[i][0]}"`, `$Change: "${rows[i][3]}"`, `%Change: "${rows[i][4]}"`);
    }
  };
  reader.readAsArrayBuffer(file);
});

// ---------- View Button Handler ----------
viewBtn.addEventListener("click", processInactiveCompanies);

function processInactiveCompanies() {
  // Clear any existing results
  clearResults();
  
  if (!fileUploaded || !workbookData || !workbookData.length) {
    showError("Please upload a valid Excel file first.");
    return;
  }

  console.log("Processing data with", workbookData.length, "rows");

  const inactiveCompanies = extractInactiveCompanies(workbookData);
  displayResults(inactiveCompanies);
}

// ---------- Data Processing ----------
function extractInactiveCompanies(rows) {
  const inactiveCompanies = [];
  
  // Start from row 7 (index 6) as specified
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    
    // Column A = Customer (index 0)
    // Column D = $ Change (PP) (index 3) 
    // Column E = % Change (PP) (index 4)
    const customer = cleanString(row[0]);
    const dollarChange = row[3];
    const percentChange = row[4];
    
    // Skip if no customer name
    if (!customer) continue;
    
    // Check if percentage change is -100% or less
    const percentValue = parsePercentage(percentChange);
    if (percentValue === null || percentValue > -100) continue;
    
    // Parse dollar amount
    const dollarValue = parseDollarAmount(dollarChange);
    if (dollarValue === null) continue; // Skip if no valid dollar amount
    
    inactiveCompanies.push({
      customer: customer,
      dollarChange: dollarValue,
      percentChange: percentValue
    });
  }
  
  // Sort by dollar change in descending order (largest decrease first)
  // Since these are negative values, we want the most negative first
  inactiveCompanies.sort((a, b) => a.dollarChange - b.dollarChange);
  
  return inactiveCompanies;
}

function parsePercentage(value) {
  if (!value && value !== 0) return null;
  
  let numValue;
  if (typeof value === 'string') {
    // Remove % symbol and any whitespace
    const cleaned = value.replace(/[%\s]/g, '');
    numValue = parseFloat(cleaned);
  } else {
    numValue = parseFloat(value);
  }
  
  if (isNaN(numValue)) return null;
  
  // If the value is between -1 and 0, it might be in decimal format (e.g., -1.0 = -100%)
  if (numValue > -1 && numValue < 0) {
    numValue *= 100;
  }
  
  return numValue;
}

function parseDollarAmount(value) {
  if (!value && value !== 0) return null;
  
  let numValue;
  if (typeof value === 'string') {
    // Remove dollar signs, commas, parentheses, and whitespace
    const cleaned = value.replace(/[\$,\s\(\)]/g, '');
    numValue = parseFloat(cleaned);
  } else {
    numValue = parseFloat(value);
  }
  
  if (isNaN(numValue)) return null;
  return numValue;
}

function cleanString(str) {
  if (!str) return "";
  return String(str).trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
}

// ---------- Display Functions ----------
function displayResults(inactiveCompanies) {
  const card = document.getElementById("card");
  
  if (inactiveCompanies.length === 0) {
    showMessage("No inactive companies found (no companies with -100% or greater decrease).");
    return;
  }
  
  // Create results container
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "results-container";
  resultsContainer.className = "results-container";
  
  // Add title
  const title = document.createElement("h2");
  title.textContent = `Inactive Companies (${inactiveCompanies.length} found)`;
  resultsContainer.appendChild(title);
  
  // Create table
  const table = document.createElement("div");
  table.className = "results-table";
  
  // Add header
  const header = document.createElement("div");
  header.className = "table-row header-row";
  header.innerHTML = `
    <div class="table-cell">Customer Name</div>
    <div class="table-cell">Dollar Change</div>
  `;
  table.appendChild(header);
  
  // Add data rows
  inactiveCompanies.forEach(company => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <div class="table-cell">${escapeHtml(company.customer)}</div>
      <div class="table-cell">$${formatNumber(company.dollarChange)}</div>
    `;
    table.appendChild(row);
  });
  
  resultsContainer.appendChild(table);
  card.appendChild(resultsContainer);
}

function showError(message) {
  showMessage(message, "error");
}

function showMessage(message, type = "info") {
  clearResults();
  
  const card = document.getElementById("card");
  const messageDiv = document.createElement("div");
  messageDiv.id = "message-container";
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  
  card.appendChild(messageDiv);
}

function clearResults() {
  const existingResults = document.getElementById("results-container");
  const existingMessage = document.getElementById("message-container");
  
  if (existingResults) existingResults.remove();
  if (existingMessage) existingMessage.remove();
}

// ---------- Utility Functions ----------
function formatNumber(num) {
  return Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}