import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { stockMovementService, StockMovement, StockValue, MovementSummary } from '../services/stockMovementService';
import { productService } from '../services/productService';
import { Product } from '../types';
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  RotateCcw,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  Boxes
} from 'lucide-react';

const Inventory: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockValue, setStockValue] = useState<StockValue | null>(null);
  const [summary, setSummary] = useState<MovementSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const toast = useToast();

  // Filtres
  const [filterType, setFilterType] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'in' as 'in' | 'out' | 'adjustment' | 'return',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [currentPage, filterType, filterProduct, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      const [valueData, productsData] = await Promise.all([
        stockMovementService.getStockValue(),
        productService.getAllProducts({ limit: 1000 })
      ]);
      setStockValue(valueData);
      setProducts(productsData.data);
      await loadSummary();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les données');
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      const { movements: data, pagination } = await stockMovementService.getAllMovements({
        movement_type: filterType || undefined,
        product_id: filterProduct ? parseInt(filterProduct) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setMovements(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements:', error);
      toast.error('Impossible de charger les mouvements');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await stockMovementService.getSummary({
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setSummary(data);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await stockMovementService.createMovement({
        product_id: parseInt(formData.product_id),
        movement_type: formData.movement_type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        reference: formData.reference,
        notes: formData.notes
      });

      toast.success('Mouvement enregistré avec succès');
      setShowModal(false);
      resetForm();
      loadMovements();
      loadInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      movement_type: 'in',
      quantity: '',
      reason: '',
      reference: '',
      notes: ''
    });
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterProduct('');
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

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case 'out': return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case 'adjustment': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'return': return <RotateCcw className="w-5 h-5 text-orange-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMovementLabel = (type: string) => {
    const labels: Record<string, string> = {
      in: 'Entrée',
      out: 'Sortie',
      adjustment: 'Ajustement',
      return: 'Retour'
    };
    return labels[type] || type;
  };

  const getMovementColor = (type: string) => {
    const colors: Record<string, string> = {
      in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      return: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSummaryByType = (type: string) => {
    const item = summary.find(s => s.movement_type === type);
    return item ? { count: item.count, quantity: item.total_quantity } : { count: 0, quantity: 0 };
  };

  const reasons = {
    in: ['Achat fournisseur', 'Réception commande', 'Transfert entrant', 'Autre'],
    out: ['Vente', 'Perte/Casse', 'Vol', 'Péremption', 'Transfert sortant', 'Autre'],
    adjustment: ['Inventaire', 'Correction erreur', 'Autre'],
    return: ['Retour client', 'Retour fournisseur', 'Autre']
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventaire</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos mouvements de stock
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau mouvement
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Valeur du stock (achat)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stockValue?.total_purchase_value || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Valeur potentielle (vente)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stockValue?.total_selling_value || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Articles en stock</p>
                <p className="text-2xl font-bold mt-1">{stockValue?.total_items || 0}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Marge potentielle</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency((stockValue?.total_selling_value || 0) - (stockValue?.total_purchase_value || 0))}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Movement Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <ArrowDownCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entrées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{getSummaryByType('in').quantity}</p>
              <p className="text-xs text-gray-400">{getSummaryByType('in').count} mouvements</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <ArrowUpCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sorties</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{getSummaryByType('out').quantity}</p>
              <p className="text-xs text-gray-400">{getSummaryByType('out').count} mouvements</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ajustements</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{getSummaryByType('adjustment').quantity}</p>
              <p className="text-xs text-gray-400">{getSummaryByType('adjustment').count} mouvements</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <RotateCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Retours</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{getSummaryByType('return').quantity}</p>
              <p className="text-xs text-gray-400">{getSummaryByType('return').count} mouvements</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="input"
            >
              <option value="">Tous les types</option>
              <option value="in">Entrées</option>
              <option value="out">Sorties</option>
              <option value="adjustment">Ajustements</option>
              <option value="return">Retours</option>
            </select>

            <select
              value={filterProduct}
              onChange={(e) => { setFilterProduct(e.target.value); setCurrentPage(1); }}
              className="input"
            >
              <option value="">Tous les produits</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="input"
              placeholder="Date début"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="input"
              placeholder="Date fin"
            />

            <button
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Movements Table */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Historique des mouvements
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun mouvement trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Stock avant</th>
                      <th>Stock après</th>
                      <th>Raison</th>
                      <th>Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement, index) => (
                      <tr key={movement.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                        <td className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(movement.movement_date || movement.created_at || '')}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.movement_type)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementColor(movement.movement_type)}`}>
                              {getMovementLabel(movement.movement_type)}
                            </span>
                          </div>
                        </td>
                        <td className="font-medium text-gray-900 dark:text-white">
                          {movement.product_name}
                        </td>
                        <td>
                          <span className={`font-bold ${movement.movement_type === 'in' || movement.movement_type === 'return'
                              ? 'text-green-600 dark:text-green-400'
                              : movement.movement_type === 'out'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                            {movement.movement_type === 'in' || movement.movement_type === 'return' ? '+' :
                              movement.movement_type === 'out' ? '-' : ''}
                            {movement.quantity}
                          </span>
                        </td>
                        <td className="text-gray-600 dark:text-gray-300">{movement.previous_stock}</td>
                        <td className="text-gray-600 dark:text-gray-300">{movement.new_stock}</td>
                        <td className="text-gray-600 dark:text-gray-300">{movement.reason || '-'}</td>
                        <td className="text-gray-600 dark:text-gray-300">{movement.username || '-'}</td>
                      </tr>
                    ))}
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

      {/* Modal Nouveau mouvement */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Nouveau mouvement de stock"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Produit *
              </label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.current_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de mouvement *
              </label>
              <select
                value={formData.movement_type}
                onChange={(e) => setFormData({
                  ...formData,
                  movement_type: e.target.value as 'in' | 'out' | 'adjustment' | 'return',
                  reason: ''
                })}
                className="input"
                required
              >
                <option value="in">Entrée de stock</option>
                <option value="out">Sortie de stock</option>
                <option value="adjustment">Ajustement</option>
                <option value="return">Retour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantité *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input"
                min="1"
                required
                placeholder="Quantité"
              />
              {formData.movement_type === 'adjustment' && (
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez un nombre négatif pour diminuer le stock
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Raison
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input"
              >
                <option value="">Sélectionner une raison</option>
                {reasons[formData.movement_type]?.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="input"
                placeholder="N° commande, facture..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Inventory;
