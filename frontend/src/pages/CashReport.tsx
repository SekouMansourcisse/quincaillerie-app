import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout/Layout';
import { saleService, CashReport as CashReportType } from '../services/saleService';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Banknote,
  Building,
  FileText,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package
} from 'lucide-react';

const CashReport: React.FC = () => {
  const [report, setReport] = useState<CashReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const toast = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await saleService.getCashReport(selectedDate);
      setReport(data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
      toast.error('Impossible de charger le rapport de caisse');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'card': return <CreditCard className="w-5 h-5" />;
      case 'transfer': return <Building className="w-5 h-5" />;
      case 'check': return <FileText className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
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

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-500',
      card: 'bg-blue-500',
      transfer: 'bg-purple-500',
      check: 'bg-orange-500'
    };
    return colors[method] || 'bg-gray-500';
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport de Caisse - ${formatDate(selectedDate)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { color: #666; font-size: 14px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 20px; font-weight: bold; color: #2563eb; }
            .stat-label { color: #666; font-size: 11px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background-color: #f0f9ff; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RAPPORT DE CAISSE</h1>
            <p class="date">${formatDate(selectedDate)}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${report?.summary.total_transactions || 0}</div>
              <div class="stat-label">Transactions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(report?.summary.total_revenue || 0)}</div>
              <div class="stat-label">Recettes totales</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(report?.summary.average_sale || 0)}</div>
              <div class="stat-label">Panier moyen</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${formatCurrency(report?.summary.total_discount || 0)}</div>
              <div class="stat-label">Remises accordées</div>
            </div>
          </div>

          <h2>Répartition par mode de paiement</h2>
          <table>
            <thead>
              <tr>
                <th>Mode de paiement</th>
                <th class="text-center">Transactions</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${report?.byPaymentMethod.map(pm => `
                <tr>
                  <td>${getPaymentMethodLabel(pm.payment_method)}</td>
                  <td class="text-center">${pm.count}</td>
                  <td class="text-right">${formatCurrency(pm.total)}</td>
                </tr>
              `).join('') || ''}
              <tr class="total-row">
                <td>TOTAL</td>
                <td class="text-center">${report?.summary.total_transactions || 0}</td>
                <td class="text-right">${formatCurrency(report?.summary.total_revenue || 0)}</td>
              </tr>
            </tbody>
          </table>

          <h2>Top 5 Produits vendus</h2>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-center">Quantité</th>
                <th class="text-right">Revenu</th>
              </tr>
            </thead>
            <tbody>
              ${report?.topProducts.map(p => `
                <tr>
                  <td>${p.product_name}</td>
                  <td class="text-center">${p.total_quantity}</td>
                  <td class="text-right">${formatCurrency(p.total_revenue)}</td>
                </tr>
              `).join('') || '<tr><td colspan="3" class="text-center">Aucune vente</td></tr>'}
            </tbody>
          </table>

          <h2>Liste des ventes</h2>
          <table>
            <thead>
              <tr>
                <th>N° Vente</th>
                <th>Heure</th>
                <th>Paiement</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${report?.sales.map(s => `
                <tr>
                  <td>${s.sale_number}</td>
                  <td>${formatTime(s.sale_date || s.created_at || '')}</td>
                  <td>${getPaymentMethodLabel(s.payment_method)}</td>
                  <td class="text-right">${formatCurrency(s.net_amount)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center">Aucune vente</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Rapport généré le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Quincaillerie Moderne</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Chargement du rapport...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" ref={reportRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rapport de Caisse</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Navigation de date */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-transparent border-x border-gray-200 dark:border-gray-700 text-center"
              />
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="btn btn-primary flex items-center gap-2"
            >
              <Printer size={20} />
              Imprimer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Transactions</p>
                <p className="text-3xl font-bold mt-1">{report?.summary.total_transactions || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Recettes totales</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(report?.summary.total_revenue || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Panier moyen</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(report?.summary.average_sale || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Remises accordées</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(report?.summary.total_discount || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition par mode de paiement */}
          <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Répartition par paiement
            </h2>
            {report?.byPaymentMethod && report.byPaymentMethod.length > 0 ? (
              <div className="space-y-4">
                {report.byPaymentMethod.map((pm, index) => {
                  const percentage = report.summary.total_revenue > 0
                    ? (pm.total / report.summary.total_revenue) * 100
                    : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getPaymentMethodColor(pm.payment_method)} text-white`}>
                            {getPaymentMethodIcon(pm.payment_method)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {getPaymentMethodLabel(pm.payment_method)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {pm.count} transaction{pm.count > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(pm.total)}
                        </p>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPaymentMethodColor(pm.payment_method)} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune transaction ce jour
              </div>
            )}
          </div>

          {/* Top produits */}
          <div className="card animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Top 5 Produits vendus
            </h2>
            {report?.topProducts && report.topProducts.length > 0 ? (
              <div className="space-y-3">
                {report.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.product_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.total_quantity} unité{product.total_quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune vente ce jour
              </div>
            )}
          </div>
        </div>

        {/* Liste des ventes */}
        <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Ventes du jour ({report?.sales.length || 0})
          </h2>
          {report?.sales && report.sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Vente</th>
                    <th>Heure</th>
                    <th>Mode paiement</th>
                    <th>Statut</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale, index) => (
                    <tr key={index} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="font-medium text-gray-900 dark:text-white">{sale.sale_number}</td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {formatTime(sale.sale_date || sale.created_at || '')}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded ${getPaymentMethodColor(sale.payment_method)} text-white`}>
                            {getPaymentMethodIcon(sale.payment_method)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {getPaymentMethodLabel(sale.payment_method)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${sale.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {sale.payment_status === 'paid' ? 'Payé' : 'En attente'}
                        </span>
                      </td>
                      <td className="text-right font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(sale.net_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                    <td colSpan={4} className="text-right text-gray-900 dark:text-white">
                      TOTAL DU JOUR
                    </td>
                    <td className="text-right text-xl text-primary-600 dark:text-primary-400">
                      {formatCurrency(report.summary.total_revenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune vente enregistrée ce jour</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CashReport;
