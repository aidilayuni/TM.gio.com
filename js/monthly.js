// js/monthly.js

const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("message");

  document.getElementById("monthlyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("month_label", document.getElementById("monthLabel").value);
    formData.append("uploaded_by", document.getElementById("monthUploader").value);
    formData.append("excelFile", document.getElementById("monthlyFile").files[0]);

    msg.textContent = "Uploading...";
    const res = await fetch(`${API_URL}/upload-monthly`, { method: "POST", body: formData });
    const data = await res.json();
    msg.textContent = data.message || data.error;

    loadMonthly();
  });

  async function loadMonthly() {
    const res = await fetch(`${API_URL}/monthly-data`);
    const list = await res.json();
    const tbody = document.querySelector("#monthlyTable tbody");
    tbody.innerHTML = "";

    list.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.month_label}</td>
        <td>${row.uploaded_by}</td>
        <td>${row.file_name}</td>
        <td>${new Date(row.upload_date).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  loadMonthly();
});
