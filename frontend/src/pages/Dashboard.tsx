import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Spinner from '../components/common/Spinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { saleService, DashboardAdvancedStats } from '../services/saleService';
import { productService } from '../services/productService';
import { DashboardStats, Product } from '../types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [advancedStats, setAdvancedStats] = useState<DashboardAdvancedStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [salesStats, dashStats, lowStock] = await Promise.all([
        saleService.getSalesStats(),
        saleService.getDashboardStats(period),
        productService.getLowStockProducts()
      ]);
      setStats(salesStats);
      setAdvancedStats(dashStats);
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
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toString();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte',
      transfer: 'Virement',
      check: 'Chèque'
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Chargement du tableau de bord...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const salesTrend = advancedStats?.trends.salesTrend || 0;
  const revenueTrend = advancedStats?.trends.revenueTrend || 0;

  // Préparer les données pour les graphiques
  const salesChartData = advancedStats?.salesByDay.map(d => ({
    date: formatDateLabel(d.date),
    ventes: d.count,
    revenue: d.total
  })) || [];

  const paymentPieData = advancedStats?.byPaymentMethod.map(p => ({
    name: getPaymentMethodLabel(p.payment_method),
    value: p.total
  })) || [];

  const categoryData = advancedStats?.byCategory.slice(0, 6).map(c => ({
    name: c.category_name.length > 12 ? c.category_name.substring(0, 12) + '...' : c.category_name,
    revenue: c.total_revenue,
    quantite: c.total_quantity
  })) || [];

  const topProductsData = advancedStats?.topProducts.slice(0, 6).map(p => ({
    name: p.product_name.length > 15 ? p.product_name.substring(0, 15) + '...' : p.product_name,
    revenue: p.total_revenue,
    quantite: p.total_quantity
  })) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.first_name || user?.username} !
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Voici un aperçu de votre activité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="input w-auto"
            >
              <option value={7}>7 derniers jours</option>
              <option value={30}>30 derniers jours</option>
              <option value={90}>90 derniers jours</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="btn btn-secondary p-2"
              title="Actualiser"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${salesTrend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {salesTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(salesTrend)}%
              </div>
            </div>
            <p className="text-blue-100 text-sm">Ventes ({period}j)</p>
            <p className="text-3xl font-bold">{advancedStats?.trends.currentPeriod.total_sales || 0}</p>
          </div>

          <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${revenueTrend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {revenueTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {Math.abs(revenueTrend)}%
              </div>
            </div>
            <p className="text-emerald-100 text-sm">Chiffre d'affaires</p>
            <p className="text-2xl font-bold">{formatCurrency(advancedStats?.trends.currentPeriod.total_revenue || 0)}</p>
          </div>

          <div className="card bg-gradient-to-br from-violet-500 to-violet-600 text-white animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-violet-100 text-sm">Panier moyen</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(stats?.average_sale) || 0)}</p>
          </div>

          <div className={`card text-white animate-slide-up ${lowStockProducts.length > 0 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`} style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              {lowStockProducts.length > 0 && (
                <span className="text-sm text-orange-200">Attention</span>
              )}
            </div>
            <p className="text-white/80 text-sm">Stock faible</p>
            <p className="text-3xl font-bold">{lowStockProducts.length}</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Evolution Chart */}
          <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Évolution des ventes
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={formatShortCurrency} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Pie Chart */}
          <div className="card animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-600" />
              Répartition par paiement
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products Chart */}
          <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Top produits vendus
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={formatShortCurrency} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Category */}
          <div className="card animate-slide-up" style={{ animationDelay: '700ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Ventes par catégorie
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={formatShortCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card animate-slide-up" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Produits en stock faible
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} à réapprovisionner
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.slice(0, 6).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Package size={18} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Stock: {product.current_stock} / Min: {product.min_stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {lowStockProducts.length > 6 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Et {lowStockProducts.length - 6} autre{lowStockProducts.length - 6 > 1 ? 's' : ''} produit{lowStockProducts.length - 6 > 1 ? 's' : ''}...
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
