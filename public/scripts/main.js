import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase configuration
const supabaseUrl = "https://eqgklaeypeoeyywefbes.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ2tsYWV5cGVvZXl5d2VmYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTExMjMsImV4cCI6MjA2MjIyNzEyM30.raO5j0aNpiuwxnPuW1o-23GVjaEps429vRyBtM0xDls";
const supabase = createClient(supabaseUrl, supabaseKey);   // Extract company names and income from the uploaded Excel file

// Ensure the DOM is fully loaded before executing the script
document.addEventListener("DOMContentLoaded", function () {
    // Access elements only after DOM content is loaded
    const form = document.getElementById("loginForm");
    const commissionForm = document.getElementById("commissionForm");

    // Check if the element exists before adding event listeners
    if (form) {
        form.addEventListener("submit", handleLogin);
    } else {
        console.warn("Login form not found.");
    }

    if (commissionForm) {
        commissionForm.addEventListener("submit", handleCommission);
    } else {
        console.warn("Commission form not found.");
    }

    console.log("DOM fully loaded and event listeners attached.");
});

// Function to handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    if (usernameInput && passwordInput && errorMessage) {
        const enteredUsername = usernameInput.value;
        const enteredPassword = passwordInput.value;

        if (enteredUsername === "testuser" && enteredPassword === "Order123!") {
            errorMessage.textContent = "Login successful!";
            errorMessage.style.color = "green";
            setTimeout(() => {
                window.location.href = "pages/landing.html";
            }, 1000);
        } else {
            errorMessage.textContent = "Invalid username or password.";
            errorMessage.style.color = "red";
        }
    } else {
        console.error("Login elements not found.");
    }
}

// Function to handle commission form submission
function handleCommission(event) {
    event.preventDefault();
    const commissionInput = document.getElementById("commissionInput");
    const currentCommission = document.getElementById("currentCommission");

    if (commissionInput && currentCommission) {
        const newCommission = commissionInput.value;
        if (newCommission !== "" && !isNaN(newCommission) && newCommission > 0) {
            localStorage.setItem("commission", newCommission);
            currentCommission.textContent = `${newCommission}%`;
            alert("Commission saved successfully!");
        } else {
            alert("Please enter a valid commission percentage.");
        }
    } else {
        console.error("Commission elements not found.");
    }
}

// Fetch companies and commission data from Supabase
async function fetchCompanyData() {
    try {
        const { data, error } = await supabase
            .from("companies_change")
            .select("company_name, owner, commission_rate");

        if (error) throw error;
        console.log("Company data from Supabase:", data);
        return data;
    } catch (err) {
        console.error("Error fetching data from Supabase:", err.message);
        return [];
    }
}

// Extract company names and income from the uploaded Excel file
function extractCompanyIncome(workbookData) {
    const extractedData = [];

    workbookData.slice(5).forEach((row, index) => {
        const companyName = row[0];
        let income = row[1];
        let expenses = row[2];
        let netIncome = 0;

        // Helper function to extract number from the `f` field
        function extractFromFormula(cell) {
            if (typeof cell === "object" && cell.f) {
                const num = parseFloat(cell.f.replace(/[=()]/g, ""));
                return !isNaN(num) ? num : 0;
            }
            return 0;
        }

        // Extract income and expenses from the formula fields
        income = extractFromFormula(income);
        expenses = extractFromFormula(expenses);
        netIncome = income + expenses;

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