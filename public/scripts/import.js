// scripts/import.js

// 1. This file no longer imports supabase-js directly; we call our proxy instead.
//    So we remove: import { createClient } from ".../supabase-js";

// 2. We wait for DOMContentLoaded to hook up just the upload & parsing logic:
document.addEventListener("DOMContentLoaded", () => {
    console.log("Import.js loaded and running.");
  
    // Grab our DOM elements
    const fileInput  = document.getElementById("fileInput");
    const uploadBtn  = document.getElementById("uploadBtn");
    const fileStatus = document.getElementById("fileStatus");
  
    let workbookData = null;
    let uploaded     = false;
  
    // 3. Handle file selection and parse the XLSX manually
    fileInput.addEventListener("change", handleFile);
  
    function handleFile(event) {
      const file = event.target.files[0];
      if (!file) {
        fileStatus.textContent = "No file selected.";
        return;
      }
      console.log("Selected file:", file.name);
  
      const reader = new FileReader();
      reader.onload = e => {
        try {
          uploaded = true;
          const data     = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet    = workbook.Sheets[workbook.SheetNames[0]];
          console.log("Raw worksheet object:", sheet);
  
          // Extract every row/column, pull 'f' (formula) or 'v' field
          const range = XLSX.utils.decode_range(sheet["!ref"]);
          const rows  = [];
  
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const row = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const ref  = XLSX.utils.encode_cell({ r: R, c: C });
              const cell = sheet[ref];
              let   val  = "";
  
              if (cell) {
                if (cell.f) {
                  // Always strip the leading "="
                  val = cell.f.replace(/^=/, "");
                } else if (cell.v !== undefined) {
                  val = cell.v;
                }
              }
              row.push(val);
            }
            rows.push(row);
          }
  
          workbookData = rows;
          sessionStorage.setItem("workbookData", JSON.stringify(rows));
          fileStatus.textContent = "File loaded successfully!";
          console.log("Parsed workbookData:", rows);
  
        } catch (err) {
          fileStatus.textContent = "Error processing file: " + err.message;
          console.error(err);
        }
      };
  
      reader.onerror = err => {
        fileStatus.textContent = "Error reading file: " + err.error.name;
        console.error(err);
      };
  
      reader.readAsArrayBuffer(file);
    }
  
    // 4. Only now, once the user clicks Upload, do we fetch & generate the report:
    uploadBtn.addEventListener("click", async () => {
      if (!uploaded) {
        alert("Please upload a valid file first.");
        return;
      }
      console.log("Upload confirmed—fetching company data via proxy…");
  
      const companyData = await fetchCompanyData();
      if (!companyData.length) {
        alert("Could not load company data. Check console for errors.");
        return;
      }
  
      // Extract & match
      const extracted = extractCompanyIncome(workbookData);
      const commissions = calculateCommissions(extracted, companyData);
  
      sessionStorage.setItem("commissionResults", JSON.stringify(commissions));
      console.log("Final commission results:", commissions);
      alert("Commission report generated successfully!");
  
       window.location.href = "report.html";
    });
  
    // 5. Proxy-based fetch (avoids CSP / CORS issues)
    async function fetchCompanyData() {
      const url = "https://eqgklaeypeoeyywefbes.supabase.co/rest/v1/companies_change?select=company_name,owner,commission_rate";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls";  // grab this from your Supabase dashboard
    
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`,
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) {
          throw new Error(`Supabase returned ${res.status}`);
        }
        const data = await res.json();
        console.log("Fetched from Supabase REST:", data);
        return data;
      } catch (err) {
        console.error("Error fetching from Supabase REST:", err);
        return [];
      }
    }
    
  
    // 6. XLSX → cleaned JSON for matching
    function extractCompanyIncome(rows) {
      const out = [];
      // skip header rows (here, first 5 rows)
      rows.slice(5).forEach((r, i) => {
        const name    = cleanCompanyName(r[0]);
        const income  = parseFloat(r[1]) || 0;
        const expense = parseFloat(r[2]) || 0;
        const net     = income + expense;
        if (name) {
          out.push({ companyName: name, income, expense, net });
          console.log(`Row ${i+6}:`, name, income, expense, net);
        }
      });
      return out;
    }
  
    // 7. Match against proxy data
    function calculateCommissions(extracted, companies) {
      const totals = {};
      extracted.forEach(({ companyName, net }) => {
        const match = companies.find(c =>
          cleanCompanyName(c.company_name) === companyName
        );
        if (match) {
          if (net > 0) {
            const commission = net * (match.commission_rate / 100);
            totals[match.owner] = (totals[match.owner] || 0) + commission;
            console.log(`Matched ${companyName} → ${match.owner}:`, commission);
          } 
          console.log(`Matched ${companyName} → ${match.owner}:`, 0);
        } else {
          console.warn("No match for:", companyName);
        }
      });
      return totals;
    }
  
    // 8. Normalize names for reliable matching
    function cleanCompanyName(s) {
      return String(s || "")
        .toLowerCase()
        .trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, "");
    }
  
  }); // end DOMContentLoaded
  