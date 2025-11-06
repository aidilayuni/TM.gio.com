// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

// --- MySQL Database Connection ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // leave empty if your XAMPP MySQL has no password
  database: "tm_data"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database (tm_data)");
  }
});

// --- Verify Login ---
app.post("/verify-password", (req, res) => {
  const { staffid, password } = req.body;

  if (!staffid || !password) {
    return res.status(400).json({ error: "Missing staffid or password" });
  }

  const sql = "SELECT password FROM staff WHERE staffid = ?";
  db.query(sql, [staffid], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database query error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Staff ID not found" });
    }

    const storedHash = result[0].password;

    bcrypt.compare(password, storedHash, (err, match) => {
      if (err) return res.status(500).json({ error: "Error verifying password" });
      if (match) {
        res.json({ message: "✅ Password match!" });
      } else {
        res.json({ message: "❌ Incorrect password" });
      }
    });
  });
});

// --- Register New Staff ---
app.post("/register", (req, res) => {
  const { staffid, name, password } = req.body;

  if (!staffid || !name || !password) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  // Check if staff already exists
  const checkSql = "SELECT staffid FROM staff WHERE staffid = ?";
  db.query(checkSql, [staffid], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: "Database error" });
    if (result.length > 0) {
      return res.json({ success: false, error: "Staff ID already exists" });
    }

    // Hash password before inserting
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashed) => {
      if (err) return res.status(500).json({ success: false, error: "Error hashing password" });

      const insertSql = "INSERT INTO staff (staffid, name, password) VALUES (?, ?, ?)";
      db.query(insertSql, [staffid, name, hashed], (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ success: false, error: "Error inserting into database" });
        }
        res.json({ success: true });
      });
    });
  });
});

app.use('/js', express.static('js'));
// --- Excel Upload Routes ---
const excelHandler = require("./excelHandler");
excelHandler(app, db);

// --- Start Server ---
const PORT = 3000; // ✅ Use port 3000, not 3306
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
