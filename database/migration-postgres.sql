-- Migration pour PostgreSQL (Supabase)
-- Exécuter ce script dans le SQL Editor de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories de produits
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  country VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reference VARCHAR(100) UNIQUE,
  barcode VARCHAR(100) UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  unit VARCHAR(50) DEFAULT 'piece',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des ventes
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  sale_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
  payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes TEXT,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails de vente
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  reference VARCHAR(255),
  reason TEXT,
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des retours/avoirs
CREATE TABLE IF NOT EXISTS returns (
  id SERIAL PRIMARY KEY,
  return_number VARCHAR(100) UNIQUE NOT NULL,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  refund_method VARCHAR(50) DEFAULT 'cash' CHECK (refund_method IN ('cash', 'credit', 'exchange')),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  reason TEXT,
  notes TEXT,
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails de retour
CREATE TABLE IF NOT EXISTS return_items (
  id SERIAL PRIMARY KEY,
  return_id INTEGER REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id INTEGER REFERENCES sale_items(id) ON DELETE SET NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des devis
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  validity_days INTEGER DEFAULT 30,
  valid_until TIMESTAMP,
  notes TEXT,
  terms_conditions TEXT,
  quotation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  converted_to_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails de devis
CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes fournisseurs
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'received', 'cancelled')),
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  notes TEXT,
  payment_terms TEXT,
  po_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des détails de commande fournisseur
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison rôles-permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, permission_id)
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
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product ON quotation_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(po_date);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Données initiales

-- Catégories par défaut
INSERT INTO categories (name, description) VALUES
  ('Quincaillerie générale', 'Outils et accessoires de quincaillerie'),
  ('Électricité', 'Matériel électrique et câblage'),
  ('Plomberie', 'Tuyaux, robinets et accessoires de plomberie'),
  ('Peinture', 'Peintures et accessoires'),
  ('Outillage', 'Outils manuels et électriques')
ON CONFLICT (name) DO NOTHING;

-- Produits de démonstration
INSERT INTO products (name, description, reference, barcode, category_id, purchase_price, selling_price, current_stock, min_stock) VALUES
  ('Marteau 500g', 'Marteau à manche bois', 'MAR-001', '3001234567890', 1, 5000, 7500, 25, 5),
  ('Tournevis plat', 'Tournevis plat 6mm', 'TRV-001', '3001234567891', 1, 1500, 2500, 50, 10),
  ('Câble électrique 2.5mm', 'Câble électrique cuivre 100m', 'CAB-001', '3001234567892', 2, 15000, 22000, 30, 5),
  ('Interrupteur simple', 'Interrupteur mural blanc', 'INT-001', '3001234567893', 2, 800, 1500, 100, 20),
  ('Robinet lavabo', 'Robinet mitigeur chromé', 'ROB-001', '3001234567894', 3, 12000, 18000, 15, 3),
  ('Peinture blanche 5L', 'Peinture acrylique mate', 'PEI-001', '3001234567895', 4, 8000, 12000, 20, 5),
  ('Perceuse électrique', 'Perceuse 750W avec coffret', 'PER-001', '3001234567896', 5, 35000, 55000, 8, 2),
  ('Clous 50mm (1kg)', 'Boîte de clous acier', 'CLO-001', '3001234567897', 1, 2000, 3500, 40, 10)
ON CONFLICT (reference) DO NOTHING;

-- Permissions
INSERT INTO permissions (code, name, description, module) VALUES
  -- Dashboard
  ('dashboard.view', 'Voir le tableau de bord', 'Accès au tableau de bord', 'Dashboard'),

  -- Produits
  ('products.view', 'Voir les produits', 'Consulter la liste des produits', 'Produits'),
  ('products.create', 'Créer des produits', 'Ajouter de nouveaux produits', 'Produits'),
  ('products.edit', 'Modifier les produits', 'Modifier les informations des produits', 'Produits'),
  ('products.delete', 'Supprimer les produits', 'Supprimer des produits', 'Produits'),

  -- Catégories
  ('categories.view', 'Voir les catégories', 'Consulter les catégories', 'Catégories'),
  ('categories.create', 'Créer des catégories', 'Ajouter des catégories', 'Catégories'),
  ('categories.edit', 'Modifier les catégories', 'Modifier les catégories', 'Catégories'),
  ('categories.delete', 'Supprimer les catégories', 'Supprimer des catégories', 'Catégories'),

  -- Fournisseurs
  ('suppliers.view', 'Voir les fournisseurs', 'Consulter les fournisseurs', 'Fournisseurs'),
  ('suppliers.create', 'Créer des fournisseurs', 'Ajouter des fournisseurs', 'Fournisseurs'),
  ('suppliers.edit', 'Modifier les fournisseurs', 'Modifier les fournisseurs', 'Fournisseurs'),
  ('suppliers.delete', 'Supprimer les fournisseurs', 'Supprimer des fournisseurs', 'Fournisseurs'),

  -- Clients
  ('customers.view', 'Voir les clients', 'Consulter les clients', 'Clients'),
  ('customers.create', 'Créer des clients', 'Ajouter des clients', 'Clients'),
  ('customers.edit', 'Modifier les clients', 'Modifier les clients', 'Clients'),
  ('customers.delete', 'Supprimer les clients', 'Supprimer des clients', 'Clients'),

  -- Ventes
  ('sales.view', 'Voir les ventes', 'Consulter l''historique des ventes', 'Ventes'),
  ('sales.create', 'Créer des ventes', 'Effectuer des ventes', 'Ventes'),
  ('sales.edit', 'Modifier les ventes', 'Modifier les ventes', 'Ventes'),
  ('sales.delete', 'Supprimer les ventes', 'Supprimer des ventes', 'Ventes'),
  ('sales.stats', 'Voir les statistiques', 'Accéder aux statistiques de ventes', 'Ventes'),

  -- Retours
  ('returns.view', 'Voir les retours', 'Consulter les retours', 'Retours'),
  ('returns.create', 'Créer des retours', 'Enregistrer des retours', 'Retours'),
  ('returns.cancel', 'Annuler les retours', 'Annuler des retours', 'Retours'),

  -- Devis
  ('quotations.view', 'Voir les devis', 'Consulter les devis', 'Devis'),
  ('quotations.create', 'Créer des devis', 'Créer de nouveaux devis', 'Devis'),
  ('quotations.edit', 'Modifier les devis', 'Modifier les devis', 'Devis'),
  ('quotations.delete', 'Supprimer les devis', 'Supprimer des devis', 'Devis'),
  ('quotations.convert', 'Convertir en vente', 'Convertir un devis en vente', 'Devis'),

  -- Commandes fournisseurs
  ('purchase_orders.view', 'Voir les commandes', 'Consulter les commandes fournisseurs', 'Commandes'),
  ('purchase_orders.create', 'Créer des commandes', 'Créer des commandes fournisseurs', 'Commandes'),
  ('purchase_orders.edit', 'Modifier les commandes', 'Modifier les commandes', 'Commandes'),
  ('purchase_orders.delete', 'Supprimer les commandes', 'Supprimer des commandes', 'Commandes'),
  ('purchase_orders.receive', 'Réceptionner les marchandises', 'Réceptionner les commandes', 'Commandes'),

  -- Inventaire
  ('inventory.view', 'Voir l''inventaire', 'Consulter les mouvements de stock', 'Inventaire'),
  ('inventory.adjust', 'Ajuster le stock', 'Effectuer des ajustements de stock', 'Inventaire'),

  -- Rapports
  ('reports.view', 'Voir les rapports', 'Accéder aux rapports', 'Rapports'),
  ('reports.export', 'Exporter les rapports', 'Exporter les données', 'Rapports'),

  -- Utilisateurs
  ('users.view', 'Voir les utilisateurs', 'Consulter les utilisateurs', 'Utilisateurs'),
  ('users.create', 'Créer des utilisateurs', 'Ajouter des utilisateurs', 'Utilisateurs'),
  ('users.edit', 'Modifier les utilisateurs', 'Modifier les utilisateurs', 'Utilisateurs'),
  ('users.delete', 'Supprimer les utilisateurs', 'Supprimer des utilisateurs', 'Utilisateurs'),

  -- Permissions
  ('permissions.manage', 'Gérer les permissions', 'Modifier les permissions des rôles', 'Permissions')
ON CONFLICT (code) DO NOTHING;

-- Attribution des permissions aux rôles

-- Admin : toutes les permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Manager : permissions sélectionnées
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions WHERE code IN (
  'dashboard.view', 'products.view', 'products.create', 'products.edit',
  'categories.view', 'categories.create', 'categories.edit',
  'suppliers.view', 'suppliers.create', 'suppliers.edit',
  'customers.view', 'customers.create', 'customers.edit',
  'sales.view', 'sales.create', 'sales.stats',
  'returns.view', 'returns.create',
  'quotations.view', 'quotations.create', 'quotations.edit', 'quotations.convert',
  'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.edit', 'purchase_orders.receive',
  'inventory.view', 'inventory.adjust',
  'reports.view', 'reports.export'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Employee : permissions de base
INSERT INTO role_permissions (role, permission_id)
SELECT 'employee', id FROM permissions WHERE code IN (
  'dashboard.view', 'products.view',
  'customers.view', 'customers.create',
  'sales.view', 'sales.create',
  'returns.view',
  'quotations.view',
  'purchase_orders.view',
  'inventory.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- IMPORTANT: Créez l'utilisateur admin dans la console Supabase ou via l'API
-- Mot de passe par défaut: admin123
-- Vous devrez hasher le mot de passe avec bcrypt avant de l'insérer
-- Exemple avec Node.js:
-- const bcrypt = require('bcryptjs');
-- const hashedPassword = await bcrypt.hash('admin123', 10);
--
-- INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
-- ('admin', 'admin@quincaillerie.com', '$2a$10$...hashedPassword...', 'Admin', 'Système', 'admin');
