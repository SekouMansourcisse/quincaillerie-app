import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { Sale, Product } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

const Statistics: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const [salesResult, productsResult] = await Promise.all([
        saleService.getAllSales({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          limit: 10000 // Fetch all sales for statistics
        }),
        productService.getAllProducts({
          limit: 10000 // Fetch all products for statistics
        })
      ]);

      setSales(salesResult.data);
      setProducts(productsResult.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
  };

  // Données pour le graphique des ventes par jour
  const getSalesByDay = () => {
    const salesByDay: { [key: string]: number } = {};

    sales.forEach(sale => {
      const date = new Date(sale.sale_date || sale.created_at || '').toLocaleDateString('fr-FR');
      salesByDay[date] = (salesByDay[date] || 0) + sale.net_amount;
    });

    return Object.entries(salesByDay).map(([date, amount]) => ({
      date,
      montant: amount
    })).slice(-15); // Dernier 15 jours
  };

  // Top 10 produits les plus vendus
  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    sales.forEach(sale => {
      sale.items?.forEach(item => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productSales[item.product_name].quantity += item.quantity;
        productSales[item.product_name].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  // Répartition des ventes par mode de paiement
  const getPaymentMethods = () => {
    const methods: { [key: string]: number } = {};

    sales.forEach(sale => {
      const method = sale.payment_method;
      methods[method] = (methods[method] || 0) + sale.net_amount;
    });

    const labels: any = {
      cash: 'Espèces',
      card: 'Carte',
      transfer: 'Virement',
      check: 'Chèque'
    };

    return Object.entries(methods).map(([method, amount]) => ({
      name: labels[method] || method,
      value: amount
    }));
  };

  // Stock par catégorie
  const getStockByCategory = () => {
    const stockByCategory: { [key: string]: number } = {};

    products.forEach(product => {
      const category = product.category_name || 'Sans catégorie';
      stockByCategory[category] = (stockByCategory[category] || 0) + (product.current_stock || 0);
    });

    return Object.entries(stockByCategory).map(([category, stock]) => ({
      category,
      stock
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.net_amount, 0);
  const totalSales = sales.length;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement des statistiques...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-gray-600 mt-1">Analyse détaillée de vos ventes et produits</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            >
              30 jours
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`btn ${period === 'year' ? 'btn-primary' : 'btn-secondary'}`}
            >
              1 an
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Revenu total</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Nombre de ventes</p>
                <p className="text-3xl font-bold mt-2">{totalSales}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Vente moyenne</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(averageSale)}</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Graphique des ventes par jour */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Évolution des ventes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSalesByDay()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="montant" stroke="#3b82f6" strokeWidth={2} name="Montant (FCFA)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 produits */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Top 10 Produits</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getTopProducts()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenu (FCFA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Modes de paiement */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Modes de paiement</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={getPaymentMethods()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPaymentMethods().map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock par catégorie */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Stock par catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getStockByCategory()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" fill="#f59e0b" name="Quantité en stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;
