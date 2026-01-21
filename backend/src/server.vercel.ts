import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importer la configuration Postgres uniquement (sans SQLite)
import pool from './config/database.vercel';

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

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
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

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Tester la connexion à la base de données
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Une erreur est survenue', details: err.message });
});

export default app;
