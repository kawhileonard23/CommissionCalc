// scripts/import.js
console.log("Import.js script loaded and running.");
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
                uploaded = true
                const data = new Uint8Array(e.target.result);
                console.log("File read as array buffer:", data);

                // Read the workbook without converting to JSON initially
                const workbook = XLSX.read(data, { type: "array" });

                // Extract the first sheet
                const firstSheetName = workbook.SheetNames[0];
                console.log("First sheet name:", firstSheetName);

                const worksheet = workbook.Sheets[firstSheetName];
                console.log("Raw worksheet data:", worksheet);

                // Instead of using sheet_to_json, directly access each cell
                const workbookData = [];
                const range = XLSX.utils.decode_range(worksheet['!ref']);

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const row = [];
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = { c: C, r: R };
                        const cellRef = XLSX.utils.encode_cell(cellAddress);
                        const cell = worksheet[cellRef];

                        if (cell) {
                            // Use formula (f) if available, otherwise use value (v)
                            let cellValue = "";
                            if (cell.f) {
                                console.log(`Cell with formula detected at ${cellRef}:`, cell.f);
                                cellValue = cell.f.replace("=", ""); // Remove '='
                            } else if (cell.v !== undefined) {
                                cellValue = cell.v;
                            } else {
                                cellValue = "";
                            }
                            row.push(cellValue);
                        } else {
                            row.push(""); // Empty cell
                        }
                    }
                    workbookData.push(row);
                }

                console.log("Directly extracted workbook data:", workbookData);

                // Save the workbook data to session storage
                sessionStorage.setItem("workbookData", JSON.stringify(workbookData));
                fileStatus.textContent = "File loaded successfully!";
                console.log("Workbook data saved to session storage.");

                // Pass the extracted data to the processing function
                extractCompanyIncome(workbookData);
            } catch (err) {
                fileStatus.textContent = "Error processing file: " + err.message;
                console.error("Error processing file:", err);
            }
        };

        reader.onerror = function (e) {
            fileStatus.textContent = "Error reading file: " + e.target.error.name;
            console.error("Error loading file:", e.target.error);
        };

        reader.readAsArrayBuffer(file);
    }

    // Event listener for file upload
    fileInput.addEventListener("change", handleFile);

    // Redirect to the report page only if file upload was successful
    uploadBtn.addEventListener("click", function () {
        if (uploaded) {
            console.log("Upload successful, generating report...");
            generateCommissionReport();  // Explicitly call the report generation
            console.log("Redirecting to report page...");
            location.href = "report.html";
        } else {
            alert("Please upload a valid file before proceeding.");
            console.warn("File not uploaded successfully, cannot redirect.");
        }
    });
    

// Extract company names and income from the uploaded Excel file
function extractCompanyIncome(workbookData) {
    const extractedData = [];

    // Log the entire workbook data to verify format
    console.log("Extracted workbook data:", workbookData);

    // Skip the first 5 rows and start from row 6 (index 5)
    workbookData.slice(5).forEach((row, index) => {
        const companyName = formatCellValue(row[0]);  // First column: Company name
        let income = formatCellValue(row[1]);         // Second column: Income (formula)
        let expenses = formatCellValue(row[2]);       // Third column: Expenses (formula)
        let netIncome = 0;

        // Directly use the formula value as a string
        income = typeof income === "string" ? income.replace("=", "") : income;
        expenses = typeof expenses === "string" ? expenses.replace("=", "") : expenses;

        // Try to convert to number if possible
        income = parseFloat(income) || 0;
        expenses = parseFloat(expenses) || 0;

        // Manually calculate net income
        netIncome = income + expenses;

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
        // Check if the cell has a formula (f field) and directly return it
        if (cell.f) {
            console.log("Raw formula detected:", cell.f);
            return cell.f;
        }
        // Check if the cell has a direct numeric value (v field)
        if (cell.v !== undefined && !isNaN(parseFloat(cell.v))) {
            console.log("Direct numeric value detected:", cell.v);
            return parseFloat(cell.v);
        }
        // Check if the cell has a formatted value (w field)
        if (cell.w) {
            console.log("Formatted value detected:", cell.w);
            return cell.w;
        }
    }
    // Return cell content if it is a plain string or number
    return cell || "";
}

async function fetchCompanyData() {
    console.log("Fetching company data from Supabase...");
    try {
        const { data, error } = await supabase
            .from("companies_change")
            .select("name, owner, commission_rate");

        if (error) throw error;

        console.log("Company data from Supabase:", data);
        return data;
    } catch (err) {
        console.error("Error fetching data from Supabase:", err.message);
        return [];
    }
}

// Match companies and calculate the commission total
function calculateCommissions(extractedData, companyData) {
    console.log("Starting company matching and commission calculation...");
    const commissionResults = {};

    extractedData.forEach(({ companyName, income }) => {
        // Clean up the company name from the extracted data
        const cleanedCompanyName = cleanCompanyName(companyName);

        console.log(`Processing company: '${cleanedCompanyName}' (from file)`);

        // Find the matching company in Supabase data (case-insensitive and trimmed)
        const company = companyData.find((item) => {
            const supabaseName = cleanCompanyName(item.company_name);
            console.log(`Comparing with Supabase entry: '${supabaseName}'`);
            return supabaseName === cleanedCompanyName;
        });

        if (company) {
            const { owner, commission_rate } = company;
            const commission = income * (commission_rate / 100);

            // Aggregate commission totals for each owner
            if (!commissionResults[owner]) {
                commissionResults[owner] = 0;
            }
            commissionResults[owner] += commission;

            console.log(
                `Matched: ${cleanedCompanyName} | Owner: ${owner} | Income: ${income} | Commission Rate: ${commission_rate}% | Commission: ${commission}`
            );
        } else {
            console.warn(`No match found for company: '${cleanedCompanyName}'`);
        }
    });

    console.log("Final commission results:", commissionResults);
    return commissionResults;
}

// Function to clean and normalize company names
function cleanCompanyName(name) {
    if (typeof name !== "string") return "";
    return name
        .toLowerCase()    // Make lowercase for case-insensitive matching
        .trim()           // Remove leading and trailing whitespace
        .replace(/[\u200B-\u200D\uFEFF]/g, ""); // Remove any zero-width or hidden characters
}




// Generate the final commission report and save it
async function generateCommissionReport() {
    try {
        console.log("generateCommissionReport() started...");
        console.log("Attempting to fetch company data from Supabase...");

        console.log("Generating commission report...");

        // Fetch data from Supabase
        const companyData = await fetchCompanyData();

        // Extract data from the uploaded workbook
        const workbookData = JSON.parse(sessionStorage.getItem("workbookData"));
        const extractedData = extractCompanyIncome(workbookData);

        // Match companies and calculate commissions
        const commissionResults = calculateCommissions(extractedData, companyData);

        // Save the commission results for later use
        sessionStorage.setItem("commissionResults", JSON.stringify(commissionResults));

        console.log("Commission results saved to session storage:", commissionResults);

        alert("Commission report generated successfully!");
    } catch (error) {
        console.error("Error generating commission report:", error.message);
    }
}




});