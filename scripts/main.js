const users = [
    { username: "testuser", password: "Order123!" }
];

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", handleLogin);
});


function handleLogin(event) {
    event.preventDefault(); // Prevents page from refreshing

    // Get the values from the input fields
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Find the user in the mock database
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        // Successful login
        alert("Login successful!");
        window.location.href = "pages/landing.html"; // Redirect to landing page
    } else {
        // Failed login
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "Incorrect username or password.";
        errorMessage.style.color = "red";
    }
}

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
