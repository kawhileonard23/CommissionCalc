// scripts/import.js

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileStatus = document.getElementById("fileStatus");

    let workbookData = null;
    let uploaded = false;

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

                // Convert worksheet to JSON with raw data
                workbookData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log("Workbook data after JSON conversion:", workbookData);

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
});
