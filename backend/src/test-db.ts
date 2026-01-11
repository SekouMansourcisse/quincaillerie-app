import pool from './config/database';

const testConnection = async () => {
    try {
        console.log('Testing database connection...');
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', res.rows[0]);

        // Check users table
        const users = await pool.query('SELECT count(*) FROM users');
        console.log('✅ Users table check:', users.rows[0]);

        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    }
};

testConnection();
