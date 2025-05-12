// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", handleLogin);
});


document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    // Hardcoded valid credentials
    const validUsername = "testuser";
    const validPassword = "Order123!";

    // Handle login form submission
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent page reload

        const enteredUsername = usernameInput.value;
        const enteredPassword = passwordInput.value;

        // Check if credentials match
        if (enteredUsername === validUsername && enteredPassword === validPassword) {
            errorMessage.textContent = "Login successful!";
            errorMessage.style.color = "green";
            setTimeout(() => {
                // Redirect to landing page after successful login
                window.location.href = "pages/landing.html";
            }, 1000);
        } else {
            errorMessage.textContent = "Invalid username or password.";
            errorMessage.style.color = "red";
        }
    });
});

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Get elements
    const commissionInput = document.getElementById("commissionInput");
    const currentCommission = document.getElementById("currentCommission");
    const commissionForm = document.getElementById("commissionForm");

    // Load the saved commission from local storage (if it exists)
    const savedCommission = localStorage.getItem("commission");
    if (savedCommission) {
        currentCommission.textContent = savedCommission + "%";
    }

    // Event listener for form submission
    commissionForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent page reload

        // Get the entered commission value
        const newCommission = commissionInput.value;

        // Validate the input
        if (newCommission === "" || isNaN(newCommission) || newCommission < 0) {
            alert("Please enter a valid commission percentage.");
            return;
        }

        // Save the commission to local storage
        localStorage.setItem("commission", newCommission);

        // Update the displayed commission
        currentCommission.textContent = newCommission + "%";

        // Clear the input field
        commissionInput.value = "";
        alert("Commission saved successfully!");
    });
});
