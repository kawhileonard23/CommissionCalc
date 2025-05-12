// scripts/import.js

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileStatus = document.getElementById("fileStatus");

    // Global variable to track upload status
    let uploaded = false;
    let workbookData = null;

    // Function to handle file reading
    function handleFile(event) {
        const file = event.target.files[0];

        if (!file) {
            fileStatus.textContent = "No file selected.";
            uploaded = false;
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                // Check if the workbook has any sheets
                if (workbook.SheetNames.length === 0) {
                    throw new Error("Workbook contains no sheets.");
                }

                // Get the first sheet name
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                if (!worksheet) {
                    throw new Error("Failed to access the first worksheet.");
                }

                // Convert the worksheet to JSON
                workbookData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Check if the data is empty
                if (workbookData.length === 0) {
                    throw new Error("The worksheet is empty.");
                }

                // Save to session storage
                sessionStorage.setItem("workbookData", JSON.stringify(workbookData));
                fileStatus.textContent = "File loaded and saved successfully!";
                console.log("Workbook loaded and saved:", workbookData);

                // Set uploaded to true on success
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

    // Event listener for upload button click
    uploadBtn.addEventListener("click", function () {
        if (uploaded) {
            location.href = "report.html";
        } else {
            alert("Please upload a valid file before proceeding.");
        }
    });
});
