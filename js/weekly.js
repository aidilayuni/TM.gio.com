// js/weekly.js

const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("message");

  document.getElementById("weeklyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("week_label", document.getElementById("weekLabel").value);
    formData.append("uploaded_by", document.getElementById("weekUploader").value);
    formData.append("excelFile", document.getElementById("weeklyFile").files[0]);

    msg.textContent = "Uploading...";
    const res = await fetch(`${API_URL}/upload-weekly`, { method: "POST", body: formData });
    const data = await res.json();
    msg.textContent = data.message || data.error;

    loadWeekly();
  });

  async function loadWeekly() {
    const res = await fetch(`${API_URL}/weekly-data`);
    const list = await res.json();
    const tbody = document.querySelector("#weeklyTable tbody");
    tbody.innerHTML = "";

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
  }

  loadWeekly();
});
