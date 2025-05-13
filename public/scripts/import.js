// scripts/import.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase configuration
const supabaseUrl = "https://eqgklaeypeoeyywefbes.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls";
const supabase = createClient(supabaseUrl, supabaseKey);   // Extract company names and income from the uploaded Excel file

// Ensure the DOM is fully loaded before executing the script
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileStatus = document.getElementById("fileStatus");

    let workbookData = null;
    let uploaded = false;

    console.log("DOM fully loaded and event listeners attached.");

    // Function to handle file reading
    function handleFile(event) {
        const file = event.target.files[0];

        if (!file) {
            fileStatus.textContent = "No file selected.";
            console.warn("No file selected.");
            return;
        }

        console.log("Selected file:", file.name);

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                console.log("File read as array buffer:", data);

                // Read the workbook with raw data
                const workbook = XLSX.read(data, { type: "array", raw: true });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                if (!worksheet) {
                    throw new Error("Failed to access the first worksheet.");
                }

                // Log the entire worksheet structure for inspection
                console.log("Worksheet object:", worksheet);

                // Convert worksheet to JSON format
                workbookData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log("Workbook data after JSON conversion:", workbookData);

                // Call data extraction
                const extractedData = extractCompanyIncome(workbookData);
                console.log("Extracted data from workbook:", extractedData);

                // Save the workbook data to session storage
                sessionStorage.setItem("workbookData", JSON.stringify(workbookData));
                fileStatus.textContent = "File loaded successfully!";
                console.log("Workbook data saved to session storage.");

                uploaded = true;
            } catch (err) {
                fileStatus.textContent = "Error processing file: " + err.message;
                console.error("Error processing file:", err);
                uploaded = false;
            }
        };

        reader.onerror = function (e) {
            fileStatus.textContent = "Error reading file: " + e.target.error.name;
            console.error("Error loading file:", e.target.error);
            uploaded = false;
        };

        reader.readAsArrayBuffer(file);
    }

    // Event listener for file upload
    fileInput.addEventListener("change", handleFile);

    // Redirect to the report page only if file upload was successful
    uploadBtn.addEventListener("click", function () {
        if (uploaded) {
            console.log("Redirecting to report page...");
            location.href = "report.html";
        } else {
            alert("Please upload a valid file before proceeding.");
            console.warn("File not uploaded successfully, cannot redirect.");
        }
    });

// Extract company names and income from the uploaded Excel file
function extractCompanyIncome(workbookData) {
    console.log("Running extractCompanyIncome function...");
    const extractedData = [];

    // Skip the first 5 rows and start from row 6 (index 5)
    workbookData.slice(5).forEach((row, index) => {
        const companyName = formatCellValue(row[0]);  // First column: Company name
        let income = formatCellValue(row[1]);         // Second column: Income
        let expenses = formatCellValue(row[2]);       // Third column: Expenses
        let netIncome = income + expenses;

        // Log the processed row for inspection
        console.log(`Processed row ${index + 6}: ${companyName} | Income: ${income} | Expenses: ${expenses} | Net Income: ${netIncome}`);

        if (companyName) {
            extractedData.push({ companyName, income, expenses, netIncome });
            console.log(`Extracted: ${companyName} | Income: ${income} | Expenses: ${expenses} | Net Income: ${netIncome}`);
        } else {
            console.warn(`Skipped invalid or empty row: ${index + 6}`);
        }
    });

    console.log("Final extracted company income data:", extractedData);
    return extractedData;
}

// Helper function to extract and format cell values
function formatCellValue(cell) {
    if (typeof cell === "object") {
        if (cell.w) return cell.w;
        if (cell.f) return cell.f;
        if (cell.v) return cell.v;
    }
    return cell || "";  // Return empty string if the cell is undefined or null
}


// Match companies and calculate the commission total
function calculateCommissions(extractedData, companyData) {
    const commissionResults = {};

    extractedData.forEach(({ companyName, income }) => {
        const company = companyData.find(
            (item) => item.company_name.toLowerCase() === companyName.toLowerCase()
        );

        if (company) {
            const { owner, commission_rate } = company;
            const commission = income * (commission_rate / 100);

            if (!commissionResults[owner]) {
                commissionResults[owner] = 0;
            }
            commissionResults[owner] += commission;

            console.log(`Matched: ${companyName}, Owner: ${owner}, Commission: ${commission}`);
        } else {
            console.warn(`No match found for company: ${companyName}`);
        }
    });

    console.log("Final commission results:", commissionResults);
    return commissionResults;
}

async function generateCommissionReport() {
    try {
        const workbookData = JSON.parse(sessionStorage.getItem("workbookData"));
        if (!workbookData) throw new Error("No workbook data available.");

        const companyData = await fetchCompanyData();
        if (!companyData || companyData.length === 0) throw new Error("Failed to fetch company data.");

        const extractedData = extractCompanyIncome(workbookData);
        if (!extractedData || extractedData.length === 0) throw new Error("Failed to extract data from workbook.");

        const commissionResults = calculateCommissions(extractedData, companyData);
        sessionStorage.setItem("commissionResults", JSON.stringify(commissionResults));
        console.log("Commission results saved to session storage.");
    } catch (error) {
        console.error("Error generating commission report:", error.message);
    }
}


document.addEventListener("DOMContentLoaded", generateCommissionReport);
    
});