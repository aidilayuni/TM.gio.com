// js/login.js

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const staffid = document.getElementById("staffid").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    // Clear any previous error message
    errorMsg.textContent = "";

    try {
        const response = await fetch("http://localhost:3000/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffid, password })
        });

        const data = await response.json();

        if (data.message === "✅ Password match!") {
            alert("Login successful!");
            // Redirect to another page (example: KPI dashboard)
            window.location.href = "kpi.html";
        } else {
            errorMsg.textContent = "Invalid staff ID or password.";
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Error connecting to server. Make sure Node.js is running.";
    }
});
