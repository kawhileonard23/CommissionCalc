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

