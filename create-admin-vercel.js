const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  // Utiliser la DATABASE_URL depuis .env.vercel
  const databaseUrl = process.env.DATABASE_URL ||
    'postgres://1d553c82c8506e9577b34726aa40c67be94f4e5f2e01c0245c5834c9584e492a:sk_RVikIfY81yIxmMraScLGE@db.prisma.io:5432/postgres?sslmode=require';

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté!');

    // Vérifier si l'utilisateur admin existe
    const checkResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@quincaillerie.com']
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️ L\'utilisateur admin existe déjà. Mise à jour du mot de passe...');

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Mettre à jour le mot de passe
      await client.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'admin@quincaillerie.com']
      );

      console.log('✅ Mot de passe admin mis à jour!');
    } else {
      console.log('📝 Création de l\'utilisateur admin...');

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Créer l'utilisateur admin
      await client.query(
        `INSERT INTO users (username, email, password, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['admin', 'admin@quincaillerie.com', hashedPassword, 'Admin', 'Système', 'admin', true]
      );

      console.log('✅ Utilisateur admin créé!');
    }

    console.log('');
    console.log('🔐 Identifiants de connexion:');
    console.log('   Email: admin@quincaillerie.com');
    console.log('   Mot de passe: admin123');
    console.log('');
    console.log('⚠️ Changez le mot de passe après votre première connexion!');

  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée.');
  }
}

createAdmin();
