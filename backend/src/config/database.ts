import dotenv from 'dotenv';
dotenv.config();

// Détermine l'environnement basé sur NODE_ENV ou DATABASE_URL
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL !== undefined;

// Import conditionnel selon l'environnement
let pool: any;
let rawDb: any = null;

if (isProduction) {
  console.log('🌍 Mode PRODUCTION - Utilisation de PostgreSQL');
  const prodDb = require('./database.prod');
  pool = prodDb.default;
  rawDb = prodDb.rawDb;
} else {
  console.log('💻 Mode DÉVELOPPEMENT - Utilisation de SQLite');
  const devDb = require('./database.sqlite');
  pool = devDb.default;
  rawDb = devDb.rawDb;
}

export default pool;
export { rawDb };
