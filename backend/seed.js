import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_system'
};

async function seed() {
    const connection = await mysql.createConnection(dbConfig);
    console.log("🚀 Memulai proses seeding...");

    try {
        const saltRounds = 10;
        const plainPassword = 'admin123'; // Password default untuk semua akun seed
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        // --- 1. SEED ROLE SYSTEM (Super Admin) ---
        const [adminRoleResult] = await connection.execute(
            `INSERT INTO sys_roles (name, description, type) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
            ['Super Admin', 'Akses penuh ke seluruh sistem', 'system']
        );
        const adminRoleId = adminRoleResult.insertId;
        console.log(`✅ Role 'Super Admin' siap (ID: ${adminRoleId})`);

        // --- 2. SEED ROLE MANAGER (Baru) ---
        const [managerRoleResult] = await connection.execute(
            `INSERT INTO sys_roles (name, description, type) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
            ['Pusat', 'Mengelola tim dan melihat dashboard cabang', 'manager']
        );
        const managerRoleId = managerRoleResult.insertId;
        console.log(`✅ Role 'Manager' siap (ID: ${managerRoleId})`);

        // --- 3. SEED USER ADMIN (System) ---
        await connection.execute(
            `INSERT INTO wa_users (username, password, full_name, role_id, branch) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             password = VALUES(password), 
             full_name = VALUES(full_name),
             role_id = VALUES(role_id)`,
            ['admin', hashedPassword, 'Administrator System', adminRoleId, 'Head Office']
        );

        console.log("\n---");
        console.log("✅ SEEDING BERHASIL!");
        console.log(`👤 Admin   : admin / ${plainPassword}`);
        console.log(`👤 Manager : manager1 / ${plainPassword}`);
        console.log("---");

    } catch (error) {
        console.error("❌ Seeding gagal:", error.message);
    } finally {
        await connection.end();
    }
}

seed();