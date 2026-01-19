/**
 * Script pour générer le hash du mot de passe admin
 * Utilisation: node database/create-admin.js
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hashedPassword => {
  console.log('\n=== Utilisateur Admin ===');
  console.log('Email: admin@quincaillerie.com');
  console.log('Password:', password);
  console.log('Password Hash:', hashedPassword);
  console.log('\n=== Requête SQL ===');
  console.log(`
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES (
  'admin',
  'admin@quincaillerie.com',
  '${hashedPassword}',
  'Admin',
  'Système',
  'admin'
);
  `);
  console.log('\nCopiez et exécutez cette requête dans le SQL Editor de Supabase.');
  console.log('');
});
