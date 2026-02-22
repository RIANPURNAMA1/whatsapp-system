import mysql from "mysql2";
import bcrypt from "bcrypt";
import "dotenv/config";

// 1. Koneksi ke Database (Mengambil data dari .env)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "whatsapp_system",
}).promise();

async function seedSuperAdmin() {
  const username = "superadmin";
  const password = "admin123"; // Password untuk login
  const fullName = "Main Administrator";
  const branch = "Head Office";

  try {
    console.log("--- START SEEDING SUPER ADMIN ---");

    // 1. Pastikan Role 'Super Admin' ada terlebih dahulu (karena Foreign Key)
    // Gunakan INSERT IGNORE agar tidak error jika id 1 sudah ada
    await db.query(`
      INSERT IGNORE INTO sys_roles (id, name, description, type) 
      VALUES (1, 'Super Admin', 'Role dengan akses penuh ke seluruh sistem', 'system')
    `);
    console.log("✅ Role 'Super Admin' dipastikan tersedia.");

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Cek apakah username sudah ada
    const [existing] = await db.query("SELECT * FROM wa_users WHERE username = ?", [username]);
    
    if (existing.length > 0) {
      console.log("⚠️ Akun superadmin sudah ada sebelumnya.");
      process.exit();
    }

    // 4. Masukkan ke database wa_users
    // role_id diisi 1 merujuk pada role yang kita buat di atas
    await db.query(
      "INSERT INTO wa_users (username, password, full_name, role_id, branch) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, fullName, 1, branch]
    );

    console.log("✅ Berhasil membuat akun Super Admin!");
    console.log("------------------------------------");
    console.log(`Username : ${username}`);
    console.log(`Password : ${password}`);
    console.log(`Role ID  : 1 (Super Admin)`);
    console.log("------------------------------------");
    console.log("Silakan gunakan kredensial ini untuk login.");

  } catch (err) {
    console.error("❌ Gagal seeding:", err.message);
  } finally {
    process.exit();
  }
}

seedSuperAdmin();