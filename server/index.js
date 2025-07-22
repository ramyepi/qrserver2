require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Utility: create MySQL connection from request body or env
function getMysqlConfig(body) {
  return {
    host: body.host || process.env.MYSQL_HOST || 'localhost',
    port: body.port || process.env.MYSQL_PORT || 3306,
    user: body.user || process.env.MYSQL_USER,
    password: body.password || process.env.MYSQL_PASSWORD,
    database: body.database || process.env.MYSQL_DATABASE,
    multipleStatements: true
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create tables endpoint
app.post('/api/mysql/create-tables', async (req, res) => {
  const config = getMysqlConfig(req.body);
  try {
    const connection = await mysql.createConnection(config);
    // Create tables for clinics, governorates, cities, site_settings
    const sql = `
      CREATE TABLE IF NOT EXISTS governorates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        governorate_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (governorate_id) REFERENCES governorates(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS clinics (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255),
        specialization VARCHAR(255),
        doctor VARCHAR(255),
        phone VARCHAR(50),
        license_number VARCHAR(100),
        license_status ENUM('active','expired','suspended','pending'),
        expiry_date DATE,
        verification_count INT DEFAULT 0,
        governorate VARCHAR(255),
        city VARCHAR(255),
        address_details VARCHAR(255),
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(255) UNIQUE,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sql);
    await connection.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CRUD for Governorates ---
app.get('/api/mysql/governorates', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT * FROM governorates ORDER BY name');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/mysql/governorates', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const { name } = req.body;
  try {
    const connection = await mysql.createConnection(config);
    const [result] = await connection.query('INSERT INTO governorates (name) VALUES (?)', [name]);
    await connection.end();
    res.json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/mysql/governorates/:id', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const { name } = req.body;
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('UPDATE governorates SET name=? WHERE id=?', [name, req.params.id]);
    await connection.end();
    res.json({ id: req.params.id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/mysql/governorates/:id', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('DELETE FROM governorates WHERE id=?', [req.params.id]);
    await connection.end();
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CRUD for Cities ---
app.get('/api/mysql/cities', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT * FROM cities ORDER BY name');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/mysql/cities', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const { name, governorate_id } = req.body;
  try {
    const connection = await mysql.createConnection(config);
    const [result] = await connection.query('INSERT INTO cities (name, governorate_id) VALUES (?, ?)', [name, governorate_id]);
    await connection.end();
    res.json({ id: result.insertId, name, governorate_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/mysql/cities/:id', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const { name, governorate_id } = req.body;
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('UPDATE cities SET name=?, governorate_id=? WHERE id=?', [name, governorate_id, req.params.id]);
    await connection.end();
    res.json({ id: req.params.id, name, governorate_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/mysql/cities/:id', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('DELETE FROM cities WHERE id=?', [req.params.id]);
    await connection.end();
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CRUD for Clinics ---
app.get('/api/mysql/clinics', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT * FROM clinics ORDER BY created_at DESC');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/mysql/clinics', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const clinic = req.body;
  try {
    const connection = await mysql.createConnection(config);
    await connection.query(
      `INSERT INTO clinics (id, name, specialization, doctor, phone, license_number, license_status, expiry_date, verification_count, governorate, city, address_details, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [clinic.id, clinic.name, clinic.specialization, clinic.doctor, clinic.phone, clinic.license_number, clinic.license_status, clinic.expiry_date, clinic.verification_count, clinic.governorate, clinic.city, clinic.address_details, clinic.address]
    );
    await connection.end();
    res.json({ id: clinic.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/mysql/clinics/:id', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const clinic = req.body;
  try {
    const connection = await mysql.createConnection(config);
    await connection.query(
      `UPDATE clinics SET name=?, specialization=?, doctor=?, phone=?, license_number=?, license_status=?, expiry_date=?, verification_count=?, governorate=?, city=?, address_details=?, address=?, updated_at=NOW() WHERE id=?`,
      [clinic.name, clinic.specialization, clinic.doctor, clinic.phone, clinic.license_number, clinic.license_status, clinic.expiry_date, clinic.verification_count, clinic.governorate, clinic.city, clinic.address_details, clinic.address, req.params.id]
    );
    await connection.end();
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/mysql/clinics/:id', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('DELETE FROM clinics WHERE id=?', [req.params.id]);
    await connection.end();
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CRUD for Site Settings ---
app.get('/api/mysql/site-settings', async (req, res) => {
  const config = getMysqlConfig(req.query);
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query('SELECT * FROM site_settings');
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/mysql/site-settings/:key', async (req, res) => {
  const config = getMysqlConfig(req.body);
  const { value } = req.body;
  try {
    const connection = await mysql.createConnection(config);
    await connection.query('UPDATE site_settings SET value=?, updated_at=NOW() WHERE key_name=?', [value, req.params.key]);
    await connection.end();
    res.json({ key: req.params.key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MySQL backend server running on port ${PORT}`);
}); 