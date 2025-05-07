// scripts/auth.js
import { registerUser, loginUser } from "./supabase.js";

document.addEventListener("DOMContentLoaded", function () {
    // Registration Form Handling
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const result = await registerUser(username, password);
            const statusMessage = document.getElementById("statusMessage");

            if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.style.color = "green";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
            } else {
                statusMessage.textContent = result.message;
                statusMessage.style.color = "red";
            }
        });
    }

    // Login Form Handling
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("loginUsername").value;
            const password = document.getElementById("loginPassword").value;

            const result = await loginUser(username, password);
            const statusMessage = document.getElementById("statusMessage");

            if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.style.color = "green";
                setTimeout(() => {
                    window.location.href = "landing.html"; // Redirect to your landing page
                }, 1000);
            } else {
                statusMessage.textContent = result.message;
                statusMessage.style.color = "red";
            }
        });
    }
});
