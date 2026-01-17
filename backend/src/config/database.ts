import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Chemin de la base de données SQLite
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/quincaillerie.db');

// Créer le dossier data s'il n'existe pas
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Créer la connexion SQLite
const db = Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ Connecté à la base de données SQLite:', dbPath);

// Wrapper pour simuler l'interface pg Pool
const pool = {
  query: async (text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> => {
    try {
      // Convertir les paramètres PostgreSQL ($1, $2) en SQLite (?)
      let sqliteQuery = text;
      if (params && params.length > 0) {
        // Remplacer $1, $2, etc. par ?
        sqliteQuery = text.replace(/\$(\d+)/g, '?');
      }

      // Remplacer ILIKE par LIKE (SQLite est case-insensitive par défaut avec COLLATE NOCASE)
      sqliteQuery = sqliteQuery.replace(/ILIKE/gi, 'LIKE');

      // Remplacer RETURNING * par rien (on gèrera ça différemment)
      const hasReturning = sqliteQuery.includes('RETURNING');
      sqliteQuery = sqliteQuery.replace(/RETURNING \*/gi, '');
      sqliteQuery = sqliteQuery.replace(/RETURNING/gi, '');

      // Nettoyer les espaces multiples
      sqliteQuery = sqliteQuery.replace(/\s+/g, ' ').trim();

      // Déterminer le type de requête
      const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');
      const isInsert = sqliteQuery.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = sqliteQuery.trim().toUpperCase().startsWith('UPDATE');
      const isDelete = sqliteQuery.trim().toUpperCase().startsWith('DELETE');

      if (isSelect) {
        const stmt = db.prepare(sqliteQuery);
        const rows = params ? stmt.all(...params) : stmt.all();
        return { rows, rowCount: rows.length };
      } else if (isInsert) {
        const stmt = db.prepare(sqliteQuery);
        const result = params ? stmt.run(...params) : stmt.run();

        if (hasReturning) {
          // Récupérer l'enregistrement inséré
          const tableName = extractTableName(text, 'INSERT');
          if (tableName) {
            const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
            const rows = [selectStmt.get(result.lastInsertRowid)];
            return { rows, rowCount: 1 };
          }
        }
        return { rows: [{ id: result.lastInsertRowid }], rowCount: result.changes };
      } else if (isUpdate) {
        // Pour UPDATE avec RETURNING, on doit d'abord récupérer les IDs concernés
        const tableName = extractTableName(text, 'UPDATE');
        let affectedIds: any[] = [];

        if (hasReturning && tableName) {
          // Extraire la clause WHERE
          const whereMatch = sqliteQuery.match(/WHERE\s+(.+?)(?:\s*$)/i);
          if (whereMatch) {
            const selectQuery = `SELECT id FROM ${tableName} WHERE ${whereMatch[1]}`;
            const selectStmt = db.prepare(selectQuery);
            // Les paramètres pour WHERE sont les derniers
            const whereParamCount = (whereMatch[1].match(/\?/g) || []).length;
            const whereParams = params ? params.slice(-whereParamCount) : [];
            affectedIds = selectStmt.all(...whereParams).map((r: any) => r.id);
          }
        }

        const stmt = db.prepare(sqliteQuery);
        const result = params ? stmt.run(...params) : stmt.run();

        if (hasReturning && tableName && affectedIds.length > 0) {
          const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
          const rows = affectedIds.map(id => selectStmt.get(id)).filter(Boolean);
          return { rows, rowCount: result.changes };
        }
        return { rows: [], rowCount: result.changes };
      } else if (isDelete) {
        const stmt = db.prepare(sqliteQuery);
        const result = params ? stmt.run(...params) : stmt.run();
        return { rows: [], rowCount: result.changes };
      }

      // Autres requêtes (CREATE, etc.)
      db.exec(sqliteQuery);
      return { rows: [], rowCount: 0 };
    } catch (error: any) {
      console.error('SQLite Error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  },

  // Pour la compatibilité avec le code existant
  connect: async () => {
    return {
      query: pool.query,
      release: () => {}
    };
  },

  end: async () => {
    db.close();
  }
};

// Fonction utilitaire pour extraire le nom de la table
function extractTableName(query: string, type: 'INSERT' | 'UPDATE' | 'DELETE'): string | null {
  let match;
  if (type === 'INSERT') {
    match = query.match(/INSERT\s+INTO\s+(\w+)/i);
  } else if (type === 'UPDATE') {
    match = query.match(/UPDATE\s+(\w+)/i);
  } else if (type === 'DELETE') {
    match = query.match(/DELETE\s+FROM\s+(\w+)/i);
  }
  return match ? match[1] : null;
}

// Exporter la base de données brute pour l'initialisation
export const rawDb = db;
export default pool;
