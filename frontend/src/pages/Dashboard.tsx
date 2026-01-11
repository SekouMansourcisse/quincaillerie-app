import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { DashboardStats, Product } from '../types';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Download
} from 'lucide-react';
import { exportLowStockToCSV } from '../utils/exportUtils';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [salesStats, lowStock] = await Promise.all([
        saleService.getSalesStats(),
        productService.getLowStockProducts()
      ]);
      setStats(salesStats);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre quincaillerie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Ventes totales</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_sales || 0}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Revenu total</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(Number(stats?.total_revenue) || 0)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Vente moyenne</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(Number(stats?.average_sale) || 0)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Stock faible</p>
                <p className="text-3xl font-bold mt-2">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Produits en stock faible</h2>
              </div>
              <button
                onClick={() => exportLowStockToCSV(lowStockProducts)}
                className="btn btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
              >
                <Download size={16} />
                Exporter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Stock actuel</th>
                    <th>Stock minimum</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td>{product.category_name || '-'}</td>
                      <td>
                        <span className="text-red-600 font-semibold">
                          {product.current_stock}
                        </span>
                      </td>
                      <td>{product.min_stock}</td>
                      <td>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          Réapprovisionner
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
