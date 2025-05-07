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
