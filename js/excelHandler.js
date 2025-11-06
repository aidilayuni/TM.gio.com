// excelHandler.js
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

module.exports = (app, db) => {
  // Setup multer for file uploads
  const upload = multer({ dest: "uploads/" });

  // --- Upload Weekly Excel File ---
  app.post("/upload-weekly", upload.single("excelFile"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const { week_label, uploaded_by } = req.body;
    if (!week_label) return res.status(400).json({ error: "Missing week_label" });

    const sql = "INSERT INTO weekly_data (week_label, uploaded_by, file_name, data_json) VALUES (?, ?, ?, ?)";
    db.query(sql, [week_label, uploaded_by || "Unknown", req.file.originalname, JSON.stringify(sheetData)], (err) => {
      fs.unlinkSync(filePath); // remove temp file
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      res.json({ success: true, message: "✅ Weekly Excel uploaded successfully!" });
    });
  });

  // --- Upload Monthly Excel File ---
  app.post("/upload-monthly", upload.single("excelFile"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const { month_label, uploaded_by } = req.body;
    if (!month_label) return res.status(400).json({ error: "Missing month_label" });

    const sql = "INSERT INTO monthly_data (month_label, uploaded_by, file_name, data_json) VALUES (?, ?, ?, ?)";
    db.query(sql, [month_label, uploaded_by || "Unknown", req.file.originalname, JSON.stringify(sheetData)], (err) => {
      fs.unlinkSync(filePath);
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      res.json({ success: true, message: "✅ Monthly Excel uploaded successfully!" });
    });
  });

  // --- Get lists and data ---
  app.get("/weekly-data", (req, res) => {
    db.query("SELECT id, week_label, upload_date, uploaded_by, file_name FROM weekly_data ORDER BY upload_date DESC", (err, results) => {
      if (err) return res.status(500).json({ error: "Database query failed" });
      res.json(results);
    });
  });

  app.get("/monthly-data", (req, res) => {
    db.query("SELECT id, month_label, upload_date, uploaded_by, file_name FROM monthly_data ORDER BY upload_date DESC", (err, results) => {
      if (err) return res.status(500).json({ error: "Database query failed" });
      res.json(results);
    });
  });

  app.get("/weekly-data/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT data_json FROM weekly_data WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ error: "Database query failed" });
      if (results.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(JSON.parse(results[0].data_json));
    });
  });

  app.get("/monthly-data/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT data_json FROM monthly_data WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ error: "Database query failed" });
      if (results.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(JSON.parse(results[0].data_json));
    });
  });
};
