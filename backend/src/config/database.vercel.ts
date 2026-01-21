import dotenv from 'dotenv';
dotenv.config();

// Configuration Postgres uniquement pour Vercel
console.log('🌍 Vercel - Utilisation de PostgreSQL uniquement');
const prodDb = require('./database.prod');

export default prodDb.default;
export const rawDb = null;
