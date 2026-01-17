import { rawDb } from './database';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  console.log('🔧 Initialisation de la base de données SQLite...');

  // Créer les tables
  rawDb.exec(`
    -- Table des utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des catégories de produits
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des fournisseurs
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des produits
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      reference TEXT UNIQUE,
      barcode TEXT UNIQUE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      purchase_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      max_stock INTEGER,
      unit TEXT DEFAULT 'piece',
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des clients
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des ventes
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
      payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
      notes TEXT,
      sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des détails de vente
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des mouvements de stock
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return')),
      quantity INTEGER NOT NULL,
      reference TEXT,
      reason TEXT,
      notes TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      previous_stock INTEGER,
      new_stock INTEGER,
      movement_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des retours/avoirs
    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      refund_method TEXT DEFAULT 'cash' CHECK (refund_method IN ('cash', 'credit', 'exchange')),
      status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
      reason TEXT,
      notes TEXT,
      return_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des détails de retour
    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER REFERENCES returns(id) ON DELETE CASCADE,
      sale_item_id INTEGER REFERENCES sale_items(id) ON DELETE SET NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
    CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(sale_id);
    CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
    CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);
    CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
  `);

  // Vérifier si l'admin existe déjà
  const adminExists = rawDb.prepare('SELECT id FROM users WHERE email = ?').get('admin@quincaillerie.com');

  if (!adminExists) {
    console.log('👤 Création de l\'utilisateur admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    rawDb.prepare(`
      INSERT INTO users (username, email, password, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin@quincaillerie.com', hashedPassword, 'Admin', 'Système', 'admin');

    console.log('✅ Utilisateur admin créé (email: admin@quincaillerie.com, mot de passe: admin123)');
  }

  // Vérifier si des catégories existent
  const categoriesExist = rawDb.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (categoriesExist.count === 0) {
    console.log('📁 Création des catégories par défaut...');
    const categories = [
      ['Quincaillerie générale', 'Outils et accessoires de quincaillerie'],
      ['Électricité', 'Matériel électrique et câblage'],
      ['Plomberie', 'Tuyaux, robinets et accessoires de plomberie'],
      ['Peinture', 'Peintures et accessoires'],
      ['Outillage', 'Outils manuels et électriques']
    ];

    const insertCategory = rawDb.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    for (const [name, description] of categories) {
      insertCategory.run(name, description);
    }
    console.log('✅ Catégories créées');
  }

  // Ajouter quelques produits de démonstration
  const productsExist = rawDb.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

  if (productsExist.count === 0) {
    console.log('📦 Création de produits de démonstration...');
    const products = [
      ['Marteau 500g', 'Marteau à manche bois', 'MAR-001', '3001234567890', 1, 5000, 7500, 25, 5],
      ['Tournevis plat', 'Tournevis plat 6mm', 'TRV-001', '3001234567891', 1, 1500, 2500, 50, 10],
      ['Câble électrique 2.5mm', 'Câble électrique cuivre 100m', 'CAB-001', '3001234567892', 2, 15000, 22000, 30, 5],
      ['Interrupteur simple', 'Interrupteur mural blanc', 'INT-001', '3001234567893', 2, 800, 1500, 100, 20],
      ['Robinet lavabo', 'Robinet mitigeur chromé', 'ROB-001', '3001234567894', 3, 12000, 18000, 15, 3],
      ['Peinture blanche 5L', 'Peinture acrylique mate', 'PEI-001', '3001234567895', 4, 8000, 12000, 20, 5],
      ['Perceuse électrique', 'Perceuse 750W avec coffret', 'PER-001', '3001234567896', 5, 35000, 55000, 8, 2],
      ['Clous 50mm (1kg)', 'Boîte de clous acier', 'CLO-001', '3001234567897', 1, 2000, 3500, 40, 10]
    ];

    const insertProduct = rawDb.prepare(`
      INSERT INTO products (name, description, reference, barcode, category_id, purchase_price, selling_price, current_stock, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of products) {
      insertProduct.run(...product);
    }
    console.log('✅ Produits de démonstration créés');
  }

  console.log('✅ Base de données initialisée avec succès !');
}
