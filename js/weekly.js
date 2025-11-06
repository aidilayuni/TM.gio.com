// js/weekly.js
const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("message");

  // Handle form submission
  document.getElementById("weeklyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const weekLabel = document.getElementById("weekLabel").value.trim();
    const uploader = document.getElementById("weekUploader").value.trim();
    const file = document.getElementById("weeklyFile").files[0];

    // --- Validation ---
    if (!weekLabel || !uploader || !file) {
      msg.textContent = "⚠️ Please fill all fields and select a file.";
      msg.style.color = "red";
      return;
    }

    const formData = new FormData();
    formData.append("week_label", weekLabel);
    formData.append("uploaded_by", uploader);
    formData.append("excelFile", file);

    msg.textContent = "📤 Uploading...";
    msg.style.color = "black";

    try {
      const res = await fetch(`${API_URL}/upload-weekly`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        msg.textContent = data.message || "✅ Upload successful!";
        msg.style.color = "green";
        loadWeekly();
      } else {
        msg.textContent = data.error || "❌ Upload failed.";
        msg.style.color = "red";
      }
    } catch (err) {
      console.error("Upload error:", err);
      msg.textContent = "⚠️ Error connecting to server.";
      msg.style.color = "red";
    }
  });

  // --- Load weekly data from DB ---
  async function loadWeekly() {
    try {
      const res = await fetch(`${API_URL}/weekly-data`);
      if (!res.ok) throw new Error("Failed to load weekly data.");
      const list = await res.json();

      const tbody = document.querySelector("#weeklyTable tbody");
      tbody.innerHTML = "";

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No data found</td></tr>`;
        return;
      }

      list.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${row.week_label}</td>
          <td>${row.uploaded_by}</td>
          <td>${row.file_name}</td>
          <td>${new Date(row.upload_date).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Load error:", err);
      const tbody = document.querySelector("#weeklyTable tbody");
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading data</td></tr>`;
    }
  }

  loadWeekly();
});
