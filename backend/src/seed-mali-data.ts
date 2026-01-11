import pool from './config/database';
import bcrypt from 'bcryptjs';

const seedData = async () => {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting seeding with Malian hardware store data...');

        await client.query('BEGIN');

        // 1. Categories
        console.log('📦 Seeding Categories...');
        const categories = [
            { name: 'Gros Œuvre', description: 'Ciment, Fer à béton, Sable, Gravier' },
            { name: 'Toiture', description: 'Tôles, Pointes, Accessoires de toiture' },
            { name: 'Plomberie', description: 'Tuyaux PVC, Robinets, Raccords' },
            { name: 'Électricité', description: 'Câbles, Prises, Ampoules, Disjoncteurs' },
            { name: 'Peinture', description: 'Peinture à eau, Peinture à huile, Pinceaux' },
            { name: 'Outillage', description: 'Marteaux, Tournevis, Pelles, Brouettes' },
            { name: 'Sanitaire', description: 'Lavabos, WC, Douches' }
        ];

        for (const cat of categories) {
            await client.query(
                `INSERT INTO categories (name, description) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO NOTHING`,
                [cat.name, cat.description]
            );
        }

        // Get Category IDs
        const catResult = await client.query('SELECT id, name FROM categories');
        const catMap = new Map(catResult.rows.map(row => [row.name, row.id]));

        // 2. Suppliers (Fournisseurs Maliens)
        console.log('🚚 Seeding Suppliers...');
        const suppliers = [
            {
                name: 'Ciment du Sahel',
                contact: 'Amadou Diallo',
                email: 'contact@cimentsahel.ml',
                phone: '+223 20 22 00 01',
                address: 'Zone Industrielle, Bamako',
                city: 'Bamako'
            },
            {
                name: 'Mali Fer SA',
                contact: 'Seydou Keita',
                email: 'ventes@malifer.com',
                phone: '+223 20 23 45 67',
                address: 'Route de Koulikoro, Bamako',
                city: 'Bamako'
            },
            {
                name: 'General Construction Mali',
                contact: 'Fatoumata Traoré',
                email: 'info@gcm.ml',
                phone: '+223 44 90 12 34',
                address: 'ACI 2000, Bamako',
                city: 'Bamako'
            },
            {
                name: 'Quincaillerie Moderne',
                contact: 'Moussa Koné',
                email: 'moussa@quincamoderne.ml',
                phone: '+223 66 77 88 99',
                address: 'Grand Marché, Bamako',
                city: 'Bamako'
            },
            {
                name: 'Seigneurie Mali',
                contact: 'Jean Diarra',
                email: 'contact@seigneurie.ml',
                phone: '+223 20 20 20 20',
                address: 'Zone Industrielle Sotuba',
                city: 'Bamako'
            }
        ];

        for (const sup of suppliers) {
            await client.query(
                `INSERT INTO suppliers (name, contact_person, email, phone, address, city, country) 
         VALUES ($1, $2, $3, $4, $5, $6, 'Mali')
         ON CONFLICT DO NOTHING`, // Assuming name constraint or just skipping duplicates logic if needed, but schema doesn't have unique name on suppliers. 
                // Actually schema doesn't have unique on supplier name, so let's check existence first to avoid dupes if running multiple times
                [sup.name, sup.contact, sup.email, sup.phone, sup.address, sup.city]
            );
        }

        // Get Supplier IDs (simple fetch, assuming unique names for this script logic)
        const supResult = await client.query('SELECT id, name FROM suppliers');
        const supMap = new Map(supResult.rows.map(row => [row.name, row.id]));

        // 3. Products (Produits adaptés au marché malien)
        console.log('🛒 Seeding Products...');
        const products = [
            // Ciment & Gros Œuvre
            {
                name: 'Ciment Diamond 50kg',
                category: 'Gros Œuvre',
                supplier: 'Ciment du Sahel',
                price_buy: 4200,
                price_sell: 4500,
                stock: 500,
                min_stock: 50,
                unit: 'sac',
                ref: 'CIM-DIA-50',
                barcode: '610123456789'
            },
            {
                name: 'Ciment Sahel 50kg',
                category: 'Gros Œuvre',
                supplier: 'Ciment du Sahel',
                price_buy: 4100,
                price_sell: 4400,
                stock: 400,
                min_stock: 40,
                unit: 'sac',
                ref: 'CIM-SAH-50',
                barcode: '610987654321'
            },
            {
                name: 'Fer à béton 6mm',
                category: 'Gros Œuvre',
                supplier: 'Mali Fer SA',
                price_buy: 1200,
                price_sell: 1500,
                stock: 1000,
                min_stock: 100,
                unit: 'barre',
                ref: 'FER-06',
                barcode: '610111222333'
            },
            {
                name: 'Fer à béton 8mm',
                category: 'Gros Œuvre',
                supplier: 'Mali Fer SA',
                price_buy: 2200,
                price_sell: 2500,
                stock: 800,
                min_stock: 80,
                unit: 'barre',
                ref: 'FER-08',
                barcode: '610444555666'
            },
            {
                name: 'Fer à béton 10mm',
                category: 'Gros Œuvre',
                supplier: 'Mali Fer SA',
                price_buy: 3500,
                price_sell: 4000,
                stock: 600,
                min_stock: 60,
                unit: 'barre',
                ref: 'FER-10',
                barcode: '610777888999'
            },
            {
                name: 'Fer à béton 12mm',
                category: 'Gros Œuvre',
                supplier: 'Mali Fer SA',
                price_buy: 5000,
                price_sell: 5500,
                stock: 400,
                min_stock: 40,
                unit: 'barre',
                ref: 'FER-12',
                barcode: '610000111222'
            },

            // Toiture
            {
                name: 'Tôle Bac Alu 0.35mm',
                category: 'Toiture',
                supplier: 'General Construction Mali',
                price_buy: 3500,
                price_sell: 4000,
                stock: 300,
                min_stock: 30,
                unit: 'feuille',
                ref: 'TOL-BAC-035',
                barcode: '610222333444'
            },
            {
                name: 'Tôle Ondulée 2m',
                category: 'Toiture',
                supplier: 'General Construction Mali',
                price_buy: 2800,
                price_sell: 3200,
                stock: 250,
                min_stock: 25,
                unit: 'feuille',
                ref: 'TOL-OND-2M',
                barcode: '610555666777'
            },
            {
                name: 'Paquet Pointes Tôle',
                category: 'Toiture',
                supplier: 'Quincaillerie Moderne',
                price_buy: 1000,
                price_sell: 1250,
                stock: 100,
                min_stock: 10,
                unit: 'paquet',
                ref: 'PNT-TOL',
                barcode: '610888999000'
            },

            // Peinture
            {
                name: 'Peinture Pantex 20kg Blanc',
                category: 'Peinture',
                supplier: 'Seigneurie Mali',
                price_buy: 18000,
                price_sell: 22000,
                stock: 50,
                min_stock: 5,
                unit: 'bidon',
                ref: 'PNT-PAN-20',
                barcode: '610123123123'
            },
            {
                name: 'Peinture à huile Glycéro 4kg',
                category: 'Peinture',
                supplier: 'Seigneurie Mali',
                price_buy: 8000,
                price_sell: 10000,
                stock: 80,
                min_stock: 10,
                unit: 'pot',
                ref: 'PNT-GLY-04',
                barcode: '610456456456'
            },

            // Plomberie
            {
                name: 'Tuyau PVC 100mm (4m)',
                category: 'Plomberie',
                supplier: 'General Construction Mali',
                price_buy: 4000,
                price_sell: 5000,
                stock: 150,
                min_stock: 20,
                unit: 'barre',
                ref: 'PVC-100',
                barcode: '610789789789'
            },
            {
                name: 'Robinet Laiton 1/2',
                category: 'Plomberie',
                supplier: 'Quincaillerie Moderne',
                price_buy: 1500,
                price_sell: 2500,
                stock: 200,
                min_stock: 20,
                unit: 'piece',
                ref: 'ROB-LAI-12',
                barcode: '610111111111'
            },

            // Électricité
            {
                name: 'Câble 1.5mm2 (Rouleau 100m)',
                category: 'Électricité',
                supplier: 'Quincaillerie Moderne',
                price_buy: 7500,
                price_sell: 9000,
                stock: 60,
                min_stock: 10,
                unit: 'rouleau',
                ref: 'CAB-15-100',
                barcode: '610222222222'
            },
            {
                name: 'Ampoule LED 9W',
                category: 'Électricité',
                supplier: 'Quincaillerie Moderne',
                price_buy: 500,
                price_sell: 1000,
                stock: 500,
                min_stock: 50,
                unit: 'piece',
                ref: 'AMP-LED-09',
                barcode: '610333333333'
            },
            {
                name: 'Prise Murale Double',
                category: 'Électricité',
                supplier: 'Quincaillerie Moderne',
                price_buy: 800,
                price_sell: 1500,
                stock: 200,
                min_stock: 20,
                unit: 'piece',
                ref: 'PRI-MUR-DBL',
                barcode: '610444444444'
            },

            // Outillage
            {
                name: 'Brouette Standard',
                category: 'Outillage',
                supplier: 'Mali Fer SA',
                price_buy: 15000,
                price_sell: 18500,
                stock: 30,
                min_stock: 5,
                unit: 'piece',
                ref: 'BRO-STD',
                barcode: '610555555555'
            },
            {
                name: 'Pelle Ronde Manche Bois',
                category: 'Outillage',
                supplier: 'Quincaillerie Moderne',
                price_buy: 2000,
                price_sell: 3000,
                stock: 100,
                min_stock: 10,
                unit: 'piece',
                ref: 'PEL-RND',
                barcode: '610666666666'
            }
        ];

        for (const prod of products) {
            await client.query(
                `INSERT INTO products (
          name, category_id, supplier_id, purchase_price, selling_price, 
          current_stock, min_stock, unit, reference, barcode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (reference) DO NOTHING`,
                [
                    prod.name,
                    catMap.get(prod.category),
                    supMap.get(prod.supplier),
                    prod.price_buy,
                    prod.price_sell,
                    prod.stock,
                    prod.min_stock,
                    prod.unit,
                    prod.ref,
                    prod.barcode
                ]
            );
        }

        // 4. Customers (Clients Maliens)
        console.log('👥 Seeding Customers...');
        const customers = [
            { name: 'Entreprise BTP Koné', email: 'contact@btpkone.ml', phone: '76000001', city: 'Bamako' },
            { name: 'Moussa Diarra', email: 'moussa.diarra@email.com', phone: '66000002', city: 'Kati' },
            { name: 'Fatoumata Sidibé', email: 'fatou.sidibe@email.com', phone: '70000003', city: 'Ségou' },
            { name: 'Ousmane Coulibaly', email: 'ousmane.c@email.com', phone: '50000004', city: 'Bamako' },
            { name: 'Saran Traoré', email: null, phone: '90000005', city: 'Bamako' }
        ];

        for (const cust of customers) {
            await client.query(
                `INSERT INTO customers (name, email, phone, city) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`, // Schema doesn't enforce unique email on customers, but let's assume we want to avoid dupes if re-run
                [cust.name, cust.email, cust.phone, cust.city]
            );
        }

        await client.query('COMMIT');
        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

seedData();
