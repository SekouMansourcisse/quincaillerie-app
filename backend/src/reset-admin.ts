import pool from './config/database';
import bcrypt from 'bcryptjs';

const checkAndResetAdmin = async () => {
    try {
        // Check if admin exists
        const res = await pool.query("SELECT * FROM users WHERE email = 'admin@quincaillerie.com'");

        if (res.rows.length === 0) {
            console.log('❌ Admin user not found!');
            // Create admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(`
        INSERT INTO users (username, email, password, first_name, last_name, role)
        VALUES ('admin', 'admin@quincaillerie.com', $1, 'Admin', 'User', 'admin')
      `, [hashedPassword]);
            console.log('✅ Admin user created with password admin123');
        } else {
            console.log('✅ Admin user found.');
            // Reset password just in case
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query("UPDATE users SET password = $1 WHERE email = 'admin@quincaillerie.com'", [hashedPassword]);
            console.log('✅ Admin password reset to admin123');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkAndResetAdmin();
