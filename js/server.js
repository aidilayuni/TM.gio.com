// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

console.log("🚀 Starting server...");

const app = express();
app.use(express.json());
app.use(cors());

// --- MySQL Database Connection ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "tm_data"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database (tm_data)");
  }
});

// Promise wrapper for async/await usage
const dbPromise = db.promise();

// --- Serve Frontend Files ---
// adjust if your static files are in another folder (e.g., './public')
app.use('/js', express.static(path.join(__dirname)));
app.use('/', express.static(path.join(__dirname, '..')));

// --- Login / Register (unchanged) ---
app.post("/verify-password", (req, res) => {
  const { staffid, password } = req.body;
  if (!staffid || !password) return res.status(400).json({ error: "Missing staffid or password" });

  const sql = "SELECT password FROM staff WHERE staffid = ?";
  db.query(sql, [staffid], (err, result) => {
    if (err) return res.status(500).json({ error: "Database query error" });
    if (result.length === 0) return res.status(404).json({ error: "Staff ID not found" });

    const storedHash = result[0].password;
    bcrypt.compare(password, storedHash, (err, match) => {
      if (err) return res.status(500).json({ error: "Error verifying password" });
      res.json({ message: match ? "✅ Password match!" : "❌ Incorrect password" });
    });
  });
});

app.post("/register", (req, res) => {
  const { staffid, name, password } = req.body;
  if (!staffid || !name || !password) return res.status(400).json({ success: false, error: "Missing required fields" });

  const checkSql = "SELECT staffid FROM staff WHERE staffid = ?";
  db.query(checkSql, [staffid], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: "Database error" });
    if (result.length > 0) return res.json({ success: false, error: "Staff ID already exists" });

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashed) => {
      if (err) return res.status(500).json({ success: false, error: "Error hashing password" });
      const insertSql = "INSERT INTO staff (staffid, name, password) VALUES (?, ?, ?)";
      db.query(insertSql, [staffid, name, hashed], (err2) => {
        if (err2) return res.status(500).json({ success: false, error: "Error inserting into database" });
        res.json({ success: true });
      });
    });
  });
});

// --- Excel Upload Routes (if implemented) ---
try {
  const excelHandler = require("./excelHandler");
  excelHandler(app, db);
} catch(e){
  console.log("No excelHandler found or error requiring it:", e.message || e);
}

// ----------------------------
// KPI API: save and load KPI datasets (kpi_values table)
// ----------------------------

// POST /api/kpi/save
app.post('/api/kpi/save', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.dataset || !body.state || !body.zones) {
      return res.status(400).json({ success: false, error: 'Missing dataset/state/zones' });
    }

    const { dataset, state, zones } = body;

    // prepare rows
    const rows = [];
    for (const zoneName of Object.keys(zones)) {
      const zoneObj = zones[zoneName] || {};
      for (const key of Object.keys(zoneObj)) {
        const rawVal = zoneObj[key];
        const val = rawVal === null || rawVal === undefined || rawVal === '' ? null : Number(rawVal);
        rows.push([dataset, state, zoneName, key, val]);
      }
    }

    if (rows.length === 0) return res.status(400).json({ success:false, error: 'No rows to save' });

    const placeholders = rows.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flat = rows.flat();

    const sql = `
      INSERT INTO kpi_values (dataset, state_name, zone_name, kpi_key, kpi_value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE kpi_value = VALUES(kpi_value), updated_at = CURRENT_TIMESTAMP
    `;

    await dbPromise.query(sql, flat);

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error saving KPI dataset', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/kpi/:dataset
app.get('/api/kpi/:dataset', async (req, res) => {
  try {
    const dataset = req.params.dataset;
    if (!dataset) return res.status(400).json({ error: 'Missing dataset param' });

    const sql = `SELECT state_name, zone_name, kpi_key, kpi_value
                 FROM kpi_values
                 WHERE dataset = ?`;
    const [rows] = await dbPromise.query(sql, [dataset]);

    const result = { state: null, zones: {} };
    rows.forEach(r => {
      result.state = r.state_name;
      if (!result.zones[r.zone_name]) result.zones[r.zone_name] = {};
      result.zones[r.zone_name][r.kpi_key] = r.kpi_value === null ? null : Number(r.kpi_value);
    });

    return res.json({ success: true, dataset: dataset, data: result });
  } catch (err) {
    console.error('Error loading KPI dataset', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ----------------------------
// DDZ API: save and load ddz datasets (ddz_values table - separate table)
// ----------------------------

// POST /api/ddz/save
app.post('/api/ddz/save', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.dataset || !body.state || !body.zones) {
      return res.status(400).json({ success: false, error: 'Missing dataset/state/zones' });
    }

    const { dataset, state, zones } = body;

    const rows = [];
    for (const zoneName of Object.keys(zones)) {
      const zoneObj = zones[zoneName] || {};
      for (const metric of Object.keys(zoneObj)) {
        const rawVal = zoneObj[metric];
        const val = rawVal === null || rawVal === undefined || rawVal === '' ? null : Number(rawVal);
        rows.push([dataset, state, zoneName, metric, val]);
      }
    }

    if (rows.length === 0) return res.status(400).json({ success:false, error: 'No rows to save' });

    const placeholders = rows.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flat = rows.flat();

    const sql = `
      INSERT INTO ddz_values (dataset, state_name, zone_name, metric, metric_value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value), updated_at = CURRENT_TIMESTAMP
    `;

    await dbPromise.query(sql, flat);

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error saving DDZ dataset', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/ddz/:dataset
app.get('/api/ddz/:dataset', async (req, res) => {
  try {
    const dataset = req.params.dataset;
    if (!dataset) return res.status(400).json({ success:false, error: 'Missing dataset param' });

    const sql = `SELECT state_name, zone_name, metric, metric_value
                 FROM ddz_values
                 WHERE dataset = ?`;
    const [rows] = await dbPromise.query(sql, [dataset]);

    const result = { state: null, zones: {} };
    rows.forEach(r => {
      result.state = r.state_name;
      if (!result.zones[r.zone_name]) result.zones[r.zone_name] = {};
      result.zones[r.zone_name][r.metric] = r.metric_value === null ? null : Number(r.metric_value);
    });

    return res.json({ success: true, dataset, data: result });
  } catch (err) {
    console.error('Error loading DDZ dataset', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
