import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import { initializeDatabase } from './config/init-db';

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
import categoryRoutes from './routes/categoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import customerRoutes from './routes/customerRoutes';
import userRoutes from './routes/userRoutes';
import stockMovementRoutes from './routes/stockMovementRoutes';
import returnRoutes from './routes/returnRoutes';
import permissionRoutes from './routes/permissionRoutes';
import quotationRoutes from './routes/quotationRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Route de test
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API de gestion de quincaillerie en ligne' });
});

// Route 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Initialiser la base de données SQLite uniquement en développement
    if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
      await initializeDatabase();
      console.log('✅ Base de données SQLite initialisée');
    }

    // Test de connexion
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Base de données connectée');

    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur uniquement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

export default app;
