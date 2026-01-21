const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL ||
    'postgres://1d553c82c8506e9577b34726aa40c67be94f4e5f2e01c0245c5834c9584e492a:sk_RVikIfY81yIxmMraScLGE@db.prisma.io:5432/postgres?sslmode=require';

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connexion à Prisma Postgres...');
    await client.connect();
    console.log('✅ Connecté à la base de données!');

    console.log('📊 Lecture du script SQL...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');

    console.log('⚙️ Exécution du script d\'initialisation...');
    await client.query(sqlScript);

    console.log('✅ Base de données initialisée avec succès!');
    console.log('');
    console.log('📋 Résumé:');
    console.log('- Toutes les tables ont été créées');
    console.log('- Index créés pour optimiser les performances');
    console.log('- Utilisateur admin créé');
    console.log('');
    console.log('🔐 Identifiants admin:');
    console.log('   Email: admin@quincaillerie.com');
    console.log('   Mot de passe: admin123');
    console.log('');
    console.log('⚠️ Changez le mot de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée.');
  }
}

initDatabase();
