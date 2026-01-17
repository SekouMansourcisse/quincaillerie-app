import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { returnService, Return, ReturnItem, ReturnStats } from '../services/returnService';
import { saleService } from '../services/saleService';
import { Sale, SaleItem } from '../types';
import {
  RotateCcw,
  Plus,
  Filter,
  Eye,
  XCircle,
  Search,
  Printer,
  DollarSign,
  TrendingDown,
  Hash,
  Calendar,
  Package,
  Banknote,
  CreditCard,
  RefreshCw
} from 'lucide-react';

const Returns: React.FC = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const toast = useToast();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Create form
  const [saleNumber, setSaleNumber] = useState('');
  const [searchingSale, setSearchingSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<(SaleItem & { returnQty: number; returnReason: string })[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit' | 'exchange'>('cash');
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    loadReturns();
    loadStats();
  }, [currentPage, filterStatus, startDate, endDate]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const { returns: data, pagination } = await returnService.getAllReturns({
        status: filterStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setReturns(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les retours');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await returnService.getStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const searchSale = async () => {
    if (!saleNumber.trim()) {
      toast.error('Veuillez entrer un numéro de vente');
      return;
    }

    try {
      setSearchingSale(true);
      // Chercher la vente par son numéro
      const { data: sales } = await saleService.getAllSales({ limit: 100 });
      const sale = sales.find(s => s.sale_number === saleNumber.trim());

      if (!sale) {
        toast.error('Vente non trouvée');
        setSelectedSale(null);
        return;
      }

      // Récupérer les détails complets
      const fullSale = await saleService.getSaleById(sale.id!);
      setSelectedSale(fullSale);

      // Préparer les items pour le retour
      if (fullSale.items) {
        setReturnItems(fullSale.items.map(item => ({
          ...item,
          returnQty: 0,
          returnReason: ''
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche de la vente');
    } finally {
      setSearchingSale(false);
    }
  };

  const handleCreateReturn = async () => {
    const itemsToReturn = returnItems.filter(item => item.returnQty > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Veuillez sélectionner au moins un article à retourner');
      return;
    }

    // Vérifier les quantités
    for (const item of itemsToReturn) {
      if (item.returnQty > item.quantity) {
        toast.error(`Quantité invalide pour ${item.product_name}`);
        return;
      }
    }

    try {
      const items: ReturnItem[] = itemsToReturn.map(item => ({
        sale_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.returnQty,
        unit_price: item.unit_price,
        subtotal: item.returnQty * item.unit_price,
        reason: item.returnReason
      }));

      await returnService.createReturn({
        sale_id: selectedSale?.id,
        items,
        refund_method: refundMethod,
        reason: returnReason,
        notes: returnNotes
      });

      toast.success('Retour enregistré avec succès');
      setShowCreateModal(false);
      resetCreateForm();
      loadReturns();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleCancelReturn = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce retour ?')) {
      return;
    }

    try {
      await returnService.cancelReturn(id);
      toast.success('Retour annulé');
      loadReturns();
      loadStats();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const viewReturnDetails = async (returnData: Return) => {
    try {
      const fullReturn = await returnService.getReturnById(returnData.id!);
      setSelectedReturn(fullReturn);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const resetCreateForm = () => {
    setSaleNumber('');
    setSelectedSale(null);
    setReturnItems([]);
    setRefundMethod('cash');
    setReturnReason('');
    setReturnNotes('');
  };

  const clearFilters = () => {
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      completed: { class: 'badge-success', label: 'Complété' },
      pending: { class: 'badge-warning', label: 'En attente' },
      cancelled: { class: 'badge-danger', label: 'Annulé' }
    };
    return badges[status] || { class: 'badge-default', label: status };
  };

  const getRefundMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      credit: 'Avoir',
      exchange: 'Échange'
    };
    return labels[method] || method;
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQty * item.unit_price), 0);
  };

  const printCreditNote = (returnData: Return) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Avoir ${returnData.return_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { font-size: 24px; margin-bottom: 5px; text-align: center; }
            h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-block { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0f9ff; font-size: 14px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; }
            .badge-green { background: #d1fae5; color: #065f46; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AVOIR / NOTE DE CRÉDIT</h1>
            <p>N° ${returnData.return_number}</p>
          </div>

          <div class="info">
            <div class="info-block">
              <strong>Date:</strong> ${formatDate(returnData.return_date || returnData.created_at || '')}<br>
              <strong>Vente d'origine:</strong> ${returnData.sale_number || 'N/A'}<br>
              <strong>Client:</strong> ${returnData.customer_name || 'Client comptoir'}
            </div>
            <div class="info-block" style="text-align: right;">
              <strong>Mode de remboursement:</strong> ${getRefundMethodLabel(returnData.refund_method)}<br>
              <strong>Statut:</strong> <span class="badge badge-green">${getStatusBadge(returnData.status).label}</span>
            </div>
          </div>

          <h2>Articles retournés</h2>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-right">Quantité</th>
                <th class="text-right">Prix unitaire</th>
                <th class="text-right">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              ${returnData.items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-right">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('') || ''}
              <tr class="total-row">
                <td colspan="3" class="text-right">TOTAL À REMBOURSER</td>
                <td class="text-right">${formatCurrency(returnData.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          ${returnData.reason ? `<p><strong>Motif:</strong> ${returnData.reason}</p>` : ''}
          ${returnData.notes ? `<p><strong>Notes:</strong> ${returnData.notes}</p>` : ''}

          <div class="footer">
            <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retours & Avoirs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez les retours produits et les notes de crédit
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau retour
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total retours</p>
                <p className="text-3xl font-bold mt-1">{stats?.total_returns || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Hash className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Montant remboursé</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.total_refunded || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Retour moyen</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.average_return || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="completed">Complétés</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulés</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="input"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="input"
            />

            <button onClick={clearFilters} className="btn btn-secondary">
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Returns Table */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Historique des retours
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun retour enregistré</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>N° Avoir</th>
                      <th>Date</th>
                      <th>Vente d'origine</th>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Remboursement</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret, index) => {
                      const statusBadge = getStatusBadge(ret.status);
                      return (
                        <tr key={ret.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                          <td className="font-medium text-gray-900 dark:text-white">{ret.return_number}</td>
                          <td className="text-gray-600 dark:text-gray-300">
                            {formatDate(ret.return_date || ret.created_at || '')}
                          </td>
                          <td className="text-gray-600 dark:text-gray-300">{ret.sale_number || '-'}</td>
                          <td className="text-gray-600 dark:text-gray-300">{ret.customer_name || 'Comptoir'}</td>
                          <td className="font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(ret.total_amount)}
                          </td>
                          <td className="text-gray-600 dark:text-gray-300">
                            {getRefundMethodLabel(ret.refund_method)}
                          </td>
                          <td>
                            <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewReturnDetails(ret)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => printCreditNote(ret)}
                                className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                                title="Imprimer avoir"
                              >
                                <Printer size={18} />
                              </button>
                              {ret.status === 'completed' && (
                                <button
                                  onClick={() => handleCancelReturn(ret.id!)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="Annuler"
                                >
                                  <XCircle size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal Création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
        title="Nouveau retour"
        size="xl"
      >
        <div className="space-y-6">
          {/* Recherche de vente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rechercher la vente d'origine
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saleNumber}
                onChange={(e) => setSaleNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchSale()}
                className="input flex-1"
                placeholder="Numéro de vente (ex: VEN20240115-001)"
              />
              <button
                onClick={searchSale}
                disabled={searchingSale}
                className="btn btn-primary flex items-center gap-2"
              >
                {searchingSale ? <Spinner size="sm" /> : <Search size={20} />}
                Rechercher
              </button>
            </div>
          </div>

          {/* Vente trouvée */}
          {selectedSale && (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-300">
                  Vente trouvée: {selectedSale.sale_number}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Montant: {formatCurrency(selectedSale.net_amount)} |
                  Date: {formatDate(selectedSale.sale_date || selectedSale.created_at || '')}
                </p>
              </div>

              {/* Items à retourner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionnez les articles à retourner
                </label>
                <div className="space-y-3">
                  {returnItems.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              Quantité achetée: {item.quantity} | Prix: {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantité à retourner</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.returnQty}
                            onChange={(e) => {
                              const newItems = [...returnItems];
                              newItems[index].returnQty = Math.min(parseInt(e.target.value) || 0, item.quantity);
                              setReturnItems(newItems);
                            }}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Motif</label>
                          <select
                            value={item.returnReason}
                            onChange={(e) => {
                              const newItems = [...returnItems];
                              newItems[index].returnReason = e.target.value;
                              setReturnItems(newItems);
                            }}
                            className="input"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="Défectueux">Défectueux</option>
                            <option value="Ne correspond pas">Ne correspond pas</option>
                            <option value="Changement d'avis">Changement d'avis</option>
                            <option value="Erreur de commande">Erreur de commande</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>
                      {item.returnQty > 0 && (
                        <p className="text-sm text-primary-600 dark:text-primary-400 mt-2">
                          Sous-total: {formatCurrency(item.returnQty * item.unit_price)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Options de remboursement */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode de remboursement
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundMethod('cash')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        refundMethod === 'cash'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Banknote className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Espèces</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundMethod('credit')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        refundMethod === 'credit'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Avoir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundMethod('exchange')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        refundMethod === 'exchange'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <RefreshCw className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Échange</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motif général
                  </label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="input"
                    placeholder="Raison du retour..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Notes additionnelles..."
                />
              </div>

              {/* Total et actions */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-red-800 dark:text-red-300">
                    Total à rembourser:
                  </span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(calculateReturnTotal())}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCreateReturn}
                  disabled={calculateReturnTotal() === 0}
                  className="btn btn-primary flex-1"
                >
                  Valider le retour
                </button>
                <button
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedReturn(null); }}
        title={`Avoir ${selectedReturn?.return_number || ''}`}
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedReturn.return_date || selectedReturn.created_at || '')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vente d'origine</p>
                <p className="font-medium">{selectedReturn.sale_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedReturn.customer_name || 'Comptoir'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode de remboursement</p>
                <p className="font-medium">{getRefundMethodLabel(selectedReturn.refund_method)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Articles retournés</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th className="text-right">Qté</th>
                      <th className="text-right">Prix</th>
                      <th className="text-right">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50 dark:bg-gray-700/50">
                      <td colSpan={3} className="text-right">TOTAL</td>
                      <td className="text-right text-red-600">{formatCurrency(selectedReturn.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReturn.reason && (
              <div>
                <p className="text-sm text-gray-500">Motif</p>
                <p>{selectedReturn.reason}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => printCreditNote(selectedReturn)}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Imprimer l'avoir
              </button>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedReturn(null); }}
                className="btn btn-secondary flex-1"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Returns;
