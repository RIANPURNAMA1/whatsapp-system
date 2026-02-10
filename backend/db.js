// db.js - Koneksi MySQL dengan connection pooling
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'whatsapp_system',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
});

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL terhubung dengan sukses!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal koneksi MySQL:', err.message);
    process.exit(1);
  });

// Helper query
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export default pool;