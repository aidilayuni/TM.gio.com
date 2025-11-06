// js/register.js

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const staffid = document.getElementById("staffid").value.trim();
    const name = document.getElementById("name").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirm").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    const successMsg = document.getElementById("successMsg");

    errorMsg.textContent = "";
    successMsg.textContent = "";

    if (!staffid || !name || !password || !confirm) {
        errorMsg.textContent = "Please fill in all fields.";
        return;
    }

    if (password !== confirm) {
        errorMsg.textContent = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/register", { // ✅ Port 3000
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffid, name, password })
        });

        const data = await response.json();

        if (data.success) {
            successMsg.textContent = "✅ Registration successful! You can now log in.";
            document.getElementById("registerForm").reset();
        } else {
            errorMsg.textContent = data.error || "Registration failed.";
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "❌ Error connecting to server. Make sure Node.js is running.";
    }
});
