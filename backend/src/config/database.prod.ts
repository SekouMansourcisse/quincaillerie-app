import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration PostgreSQL pour la production (Supabase/Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test de connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
  } else {
    console.log('✅ Connecté à PostgreSQL (Production)');
    release();
  }
});

export default pool;
export const rawDb = null; // Pas de rawDb en PostgreSQL
