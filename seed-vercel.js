const { Client } = require('pg');
require('dotenv').config();

async function seedDatabase() {
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
    console.log('');

    // 1. Catégories
    console.log('📂 Insertion des catégories...');
    const categories = [
      ['Quincaillerie générale', 'Outils et accessoires de quincaillerie'],
      ['Électricité', 'Matériel électrique et câblage'],
      ['Plomberie', 'Tuyaux, robinets et accessoires de plomberie'],
      ['Peinture', 'Peintures et accessoires'],
      ['Outillage', 'Outils manuels et électriques'],
      ['Sécurité', 'Équipements de sécurité et protection'],
      ['Jardinage', 'Outils et équipements de jardinage'],
      ['Construction', 'Matériaux de construction']
    ];

    for (const [name, description] of categories) {
      await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [name, description]
      );
    }
    console.log(`✅ ${categories.length} catégories insérées`);

    // 2. Fournisseurs
    console.log('🚚 Insertion des fournisseurs...');
    const suppliers = [
      ['Quincaillerie Dupont', 'Jean Dupont', 'contact@dupont.com', '+33 1 23 45 67 89', '15 rue de la République', 'Paris', 'France', 'Fournisseur principal de quincaillerie'],
      ['Électro Pro', 'Marie Martin', 'info@electropro.com', '+33 1 98 76 54 32', '8 avenue des Électriciens', 'Lyon', 'France', 'Spécialiste en matériel électrique'],
      ['Plomberie Services', 'Paul Bernard', 'contact@plomberie-services.com', '+33 2 34 56 78 90', '22 boulevard de la Plomberie', 'Marseille', 'France', 'Expert en équipements de plomberie'],
      ['Couleurs & Peintures', 'Sophie Dubois', 'contact@couleurs-peintures.com', '+33 3 45 67 89 01', '5 rue des Artistes', 'Toulouse', 'France', 'Distributeur de peintures professionnelles'],
      ['Outils Pro', 'Michel Lambert', 'contact@outilspro.com', '+33 4 56 78 90 12', '18 zone industrielle', 'Nantes', 'France', 'Outillage professionnel']
    ];

    for (const [name, contact_person, email, phone, address, city, country, notes] of suppliers) {
      await client.query(
        'INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [name, contact_person, email, phone, address, city, country, notes]
      );
    }
    console.log(`✅ ${suppliers.length} fournisseurs insérés`);

    // Récupérer les IDs des catégories et fournisseurs
    const catResult = await client.query('SELECT id, name FROM categories');
    const suppResult = await client.query('SELECT id, name FROM suppliers');

    const catMap = {};
    catResult.rows.forEach(row => catMap[row.name] = row.id);

    const suppMap = {};
    suppResult.rows.forEach(row => suppMap[row.name] = row.id);

    // 3. Produits
    console.log('📦 Insertion des produits...');
    const products = [
      ['Marteau 500g', 'Marteau à manche bois de qualité professionnelle', 'MAR-001', '3001234567890', 'Quincaillerie générale', 'Quincaillerie Dupont', 5000, 7500, 25, 5, 100, 'unité'],
      ['Tournevis plat 6mm', 'Tournevis plat professionnel 6mm', 'TRV-001', '3001234567891', 'Quincaillerie générale', 'Quincaillerie Dupont', 1500, 2500, 50, 10, 200, 'unité'],
      ['Câble électrique 2.5mm', 'Câble électrique cuivre 100m', 'CAB-001', '3001234567892', 'Électricité', 'Électro Pro', 15000, 22000, 30, 5, 50, 'rouleau'],
      ['Interrupteur simple', 'Interrupteur mural blanc', 'INT-001', '3001234567893', 'Électricité', 'Électro Pro', 800, 1500, 100, 20, 500, 'unité'],
      ['Robinet lavabo', 'Robinet mitigeur chromé', 'ROB-001', '3001234567894', 'Plomberie', 'Plomberie Services', 12000, 18000, 15, 3, 50, 'unité'],
      ['Peinture blanche 5L', 'Peinture acrylique mate blanche', 'PEI-001', '3001234567895', 'Peinture', 'Couleurs & Peintures', 8000, 12000, 20, 5, 100, 'pot'],
      ['Perceuse électrique', 'Perceuse 750W avec coffret', 'PER-001', '3001234567896', 'Outillage', 'Outils Pro', 35000, 55000, 8, 2, 30, 'unité'],
      ['Clous 50mm (1kg)', 'Boîte de clous acier 50mm', 'CLO-001', '3001234567897', 'Quincaillerie générale', 'Quincaillerie Dupont', 2000, 3500, 40, 10, 200, 'kg'],
      ['Scie à main', 'Scie à main 45cm lame acier', 'SCI-001', '3001234567898', 'Outillage', 'Outils Pro', 4500, 7000, 15, 5, 50, 'unité'],
      ['Ruban adhésif', 'Ruban adhésif transparent 50m', 'RUB-001', '3001234567899', 'Quincaillerie générale', 'Quincaillerie Dupont', 500, 1200, 100, 20, 500, 'rouleau'],
      ['Ampoule LED 12W', 'Ampoule LED blanc chaud 12W E27', 'AMP-001', '3001234567900', 'Électricité', 'Électro Pro', 1200, 2500, 80, 15, 300, 'unité'],
      ['Tuyau PVC 32mm', 'Tuyau PVC évacuation 32mm - 2m', 'TUY-001', '3001234567901', 'Plomberie', 'Plomberie Services', 800, 1500, 50, 10, 200, 'barre'],
      ['Pinceau 50mm', 'Pinceau plat poils naturels 50mm', 'PIN-001', '3001234567902', 'Peinture', 'Couleurs & Peintures', 800, 1500, 30, 5, 100, 'unité'],
      ['Gants de protection', 'Gants de travail renforcés', 'GAN-001', '3001234567903', 'Sécurité', 'Outils Pro', 1500, 2800, 60, 20, 200, 'paire'],
      ['Masque antipoussière', 'Masque jetable FFP2 (boîte de 10)', 'MAS-001', '3001234567904', 'Sécurité', 'Outils Pro', 2500, 4500, 40, 10, 150, 'boîte'],
      ['Bêche', 'Bêche de jardin manche bois', 'BEC-001', '3001234567905', 'Jardinage', 'Quincaillerie Dupont', 6000, 9500, 12, 3, 50, 'unité'],
      ['Sac de ciment 25kg', 'Ciment gris 25kg', 'CIM-001', '3001234567906', 'Construction', 'Quincaillerie Dupont', 3500, 5500, 100, 20, 500, 'sac'],
      ['Niveau à bulle 60cm', 'Niveau à bulle professionnel', 'NIV-001', '3001234567907', 'Outillage', 'Outils Pro', 4500, 7500, 18, 5, 60, 'unité'],
      ['Échelle 3m', 'Échelle aluminium 3 marches', 'ECH-001', '3001234567908', 'Outillage', 'Outils Pro', 15000, 25000, 5, 2, 20, 'unité'],
      ['Vis bois 4x40mm (500pcs)', 'Boîte de vis bois', 'VIS-001', '3001234567909', 'Quincaillerie générale', 'Quincaillerie Dupont', 2500, 4000, 50, 15, 200, 'boîte']
    ];

    for (const [name, description, reference, barcode, category, supplier, purchase, selling, stock, minStock, maxStock, unit] of products) {
      await client.query(
        `INSERT INTO products (name, description, reference, barcode, category_id, supplier_id, purchase_price, selling_price, current_stock, min_stock, max_stock, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (reference) DO NOTHING`,
        [name, description, reference, barcode, catMap[category], suppMap[supplier], purchase, selling, stock, minStock, maxStock, unit]
      );
    }
    console.log(`✅ ${products.length} produits insérés`);

    // 4. Clients
    console.log('👥 Insertion des clients...');
    const customers = [
      ['Entreprise Martin', 'contact@martin-entreprise.com', '+33 1 23 45 67 89', '25 rue du Commerce', 'Paris', 'Client professionnel régulier'],
      ['SARL Dupont Construction', 'contact@dupont-construction.com', '+33 2 34 56 78 90', '12 avenue des Bâtisseurs', 'Lyon', 'Grande entreprise de construction'],
      ['Artisan Legrand', 'legrand.artisan@email.com', '+33 3 45 67 89 01', '8 rue des Artisans', 'Marseille', 'Artisan électricien'],
      ['Plomberie Bernard', 'bernard.plomberie@email.com', '+33 4 56 78 90 12', '15 boulevard de la Plomberie', 'Toulouse', 'Entreprise de plomberie'],
      ['Client Particulier', null, '+33 6 12 34 56 78', null, null, 'Client de passage'],
      ['Rénovation Pro', 'contact@renovation-pro.com', '+33 5 67 89 01 23', '30 zone artisanale', 'Nantes', 'Spécialiste rénovation'],
      ['Électricité Services', 'contact@elec-services.com', '+33 6 78 90 12 34', '18 rue de l\'Industrie', 'Nice', 'Entreprise d\'électricité'],
      ['Peinture Déco', 'contact@peinture-deco.com', '+33 7 89 01 23 45', '22 avenue des Peintres', 'Strasbourg', 'Entreprise de peinture']
    ];

    for (const [name, email, phone, address, city, notes] of customers) {
      await client.query(
        'INSERT INTO customers (name, email, phone, address, city, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, email, phone, address, city, notes]
      );
    }
    console.log(`✅ ${customers.length} clients insérés`);

    // Récupérer quelques produits et clients pour créer des ventes
    const productsResult = await client.query('SELECT id, name, selling_price FROM products LIMIT 5');
    const customersResult = await client.query('SELECT id, name FROM customers LIMIT 3');
    const userResult = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);

    if (productsResult.rows.length > 0 && customersResult.rows.length > 0 && userResult.rows.length > 0) {
      console.log('💰 Insertion de ventes de démonstration...');

      const userId = userResult.rows[0].id;

      // Créer 3 ventes de démonstration
      for (let i = 0; i < 3; i++) {
        const customer = customersResult.rows[i];
        const saleNumber = `VTE-${Date.now()}-${i}`;

        let totalAmount = 0;
        const saleItems = [];

        // Ajouter 2-3 produits par vente
        const numItems = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numItems && j < productsResult.rows.length; j++) {
          const product = productsResult.rows[j];
          const quantity = 1 + Math.floor(Math.random() * 3);
          const subtotal = product.selling_price * quantity;
          totalAmount += subtotal;

          saleItems.push({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.selling_price,
            subtotal: subtotal
          });
        }

        const discount = 0;
        const tax = Math.round(totalAmount * 0.2); // TVA 20%
        const netAmount = totalAmount - discount + tax;

        // Insérer la vente
        const saleResult = await client.query(
          `INSERT INTO sales (sale_number, customer_id, user_id, total_amount, discount, tax, net_amount, payment_method, payment_status, sale_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP - INTERVAL '${i} days')
           RETURNING id`,
          [saleNumber, customer.id, userId, totalAmount, discount, tax, netAmount, 'cash', 'paid']
        );

        const saleId = saleResult.rows[0].id;

        // Insérer les items de la vente
        for (const item of saleItems) {
          await client.query(
            'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
            [saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal]
          );
        }
      }

      console.log('✅ 3 ventes de démonstration créées');
    }

    console.log('');
    console.log('🎉 Seed terminé avec succès!');
    console.log('');
    console.log('📊 Résumé des données insérées:');
    console.log(`   - ${categories.length} catégories`);
    console.log(`   - ${suppliers.length} fournisseurs`);
    console.log(`   - ${products.length} produits`);
    console.log(`   - ${customers.length} clients`);
    console.log('   - 3 ventes de démonstration');
    console.log('');
    console.log('✅ Vous pouvez maintenant vous connecter et explorer l\'application!');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée.');
  }
}

seedDatabase();
