import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support pour Supabase (DATABASE_URL) ou configuration traditionnelle
// Configuration optimisée pour serverless (Vercel)
const isProduction = process.env.NODE_ENV === 'production';
const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Optimisé pour serverless: moins de connexions, timeout plus court
    max: isProduction ? 2 : 20,
    idleTimeoutMillis: isProduction ? 10000 : 30000,
    connectionTimeoutMillis: 2000,
  }
  : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'quincaillerie_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: isProduction ? 2 : 20,
    idleTimeoutMillis: isProduction ? 10000 : 30000,
    connectionTimeoutMillis: 2000,
  };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connecté à la base de données PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue de la base de données', err);
  process.exit(-1);
});

export default pool;
