import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { purchaseOrderService, PurchaseOrderStats } from '../services/purchaseOrderService';
import { productService } from '../services/productService';
import { supplierService } from '../services/supplierService';
import { PurchaseOrder, PurchaseOrderItem, Product, Supplier } from '../types';
import {
  Truck,
  Plus,
  Filter,
  Eye,
  Trash2,
  Package,
  DollarSign,
  Clock
} from 'lucide-react';

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const toast = useToast();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Create form
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | undefined>(undefined);
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Receive form
  const [receiveItems, setReceiveItems] = useState<{ item_id: number; product_name: string; quantity_ordered: number; quantity_received: number; quantity_to_receive: number }[]>([]);

  useEffect(() => {
    loadPurchaseOrders();
    loadStats();
  }, [currentPage, filterStatus, startDate, endDate]);

  useEffect(() => {
    if (showCreateModal) {
      loadSuppliers();
      loadProducts();
    }
  }, [showCreateModal]);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const { data, pagination } = await purchaseOrderService.getAllPurchaseOrders({
        status: filterStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setPurchaseOrders(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await purchaseOrderService.getStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const result = await supplierService.getAllSuppliers() as any;
      setSuppliers(Array.isArray(result) ? result : result.data);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productService.getAllProducts() as any;
      setProducts(Array.isArray(result) ? result : result.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const handleAddItem = () => {
    setPoItems([
      ...poItems,
      {
        product_id: undefined,
        product_name: '',
        quantity_ordered: 1,
        unit_price: 0,
        subtotal: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...poItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Si c'est un produit sélectionné, remplir automatiquement
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.purchase_price || 0;
      }
    }

    // Calculer le sous-total
    if (field === 'quantity_ordered' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].quantity_ordered * newItems[index].unit_price;
    }

    setPoItems(newItems);
  };

  const calculateTotals = () => {
    const totalAmount = poItems.reduce((sum, item) => sum + item.subtotal, 0);
    const netAmount = totalAmount - discount + tax;
    return { totalAmount, netAmount };
  };

  const handleCreatePO = async () => {
    if (poItems.length === 0) {
      toast.error('Veuillez ajouter au moins un article');
      return;
    }

    if (poItems.some(item => !item.product_name || item.quantity_ordered <= 0 || item.unit_price <= 0)) {
      toast.error('Veuillez remplir tous les champs correctement');
      return;
    }

    try {
      await purchaseOrderService.createPurchaseOrder({
        supplier_id: selectedSupplier,
        items: poItems,
        discount,
        tax,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes,
        payment_terms: paymentTerms
      });

      toast.success('Commande créée avec succès');
      resetCreateForm();
      setShowCreateModal(false);
      loadPurchaseOrders();
      loadStats();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la commande');
    }
  };

  const resetCreateForm = () => {
    setSelectedSupplier(undefined);
    setPoItems([]);
    setDiscount(0);
    setTax(0);
    setExpectedDeliveryDate('');
    setNotes('');
    setPaymentTerms('');
  };

  const handleViewDetails = async (po: PurchaseOrder) => {
    try {
      const fullPO = await purchaseOrderService.getPurchaseOrderById(po.id!);
      setSelectedPO(fullPO);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleOpenReceiveModal = async (po: PurchaseOrder) => {
    try {
      const fullPO = await purchaseOrderService.getPurchaseOrderById(po.id!);
      setSelectedPO(fullPO);

      // Préparer les items pour la réception
      const items = (fullPO.items || []).map(item => ({
        item_id: item.id!,
        product_name: item.product_name,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_received || 0,
        quantity_to_receive: Math.max(0, item.quantity_ordered - (item.quantity_received || 0))
      }));
      setReceiveItems(items);
      setShowReceiveModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleReceiveQuantityChange = (index: number, value: number) => {
    const newItems = [...receiveItems];
    const maxQty = newItems[index].quantity_ordered - newItems[index].quantity_received;
    newItems[index].quantity_to_receive = Math.min(Math.max(0, value), maxQty);
    setReceiveItems(newItems);
  };

  const handleReceiveGoods = async () => {
    if (!selectedPO) return;

    const itemsToReceive = receiveItems
      .filter(item => item.quantity_to_receive > 0)
      .map(item => ({
        item_id: item.item_id,
        quantity_received: item.quantity_to_receive
      }));

    if (itemsToReceive.length === 0) {
      toast.error('Veuillez entrer au moins une quantité à réceptionner');
      return;
    }

    try {
      await purchaseOrderService.receiveGoods(selectedPO.id!, itemsToReceive);
      toast.success('Marchandises réceptionnées avec succès. Stock mis à jour.');
      setShowReceiveModal(false);
      setSelectedPO(null);
      loadPurchaseOrders();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la réception');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      await purchaseOrderService.deletePurchaseOrder(id);
      toast.success('Commande supprimée avec succès');
      loadPurchaseOrders();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Envoyée' },
      partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partielle' },
      received: { color: 'bg-green-100 text-green-800', label: 'Reçue' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Annulée' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const { totalAmount, netAmount } = calculateTotals();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Commandes Fournisseurs</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Gérez vos approvisionnements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Nouvelle commande</span>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total commandes</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total_orders ?? 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.draft_count ?? 0} brouillons · {stats.sent_count ?? 0} envoyées
                  </p>
                </div>
                <Truck className="text-blue-600 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Valeur totale</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {(stats.total_value ?? 0).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.partial_count ?? 0} partielles · {stats.cancelled_count ?? 0} annulées
                  </p>
                </div>
                <DollarSign className="text-green-600 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">En attente</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {((stats.sent_count ?? 0) + (stats.partial_count ?? 0))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(stats.pending_value ?? 0).toLocaleString('fr-FR')} FCFA · {stats.received_count ?? 0} reçues
                  </p>
                </div>
                <Clock className="text-orange-600 flex-shrink-0" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="input"
              >
                <option value="">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="partial">Partielle</option>
                <option value="received">Reçue</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Mobile scroll hint */}
          <div className="md:hidden px-4 py-2 bg-gray-50 dark:bg-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
            ← Faites défiler horizontalement →
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">N° Commande</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fournisseur</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Livraison</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {po.po_number}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {po.supplier_name || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {po.po_date ? new Date(po.po_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {po.net_amount.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewDetails(po)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                            title="Voir détails"
                          >
                            <Eye size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(po.id!)}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                              title="Supprimer"
                            >
                              <Trash2 size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                          {(po.status === 'sent' || po.status === 'partial') && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-target"
                              title="Réceptionner"
                            >
                              <Package size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Créer une nouvelle commande"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur (optionnel)</label>
            <select
              value={selectedSupplier || ''}
              onChange={(e) => setSelectedSupplier(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Articles</label>
              <button
                onClick={handleAddItem}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Ajouter un article
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {poItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start border-b pb-2">
                  <div className="flex-1">
                    <select
                      value={item.product_id || ''}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Sélectionner un produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.purchase_price} FCFA
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity_ordered}
                    onChange={(e) => handleItemChange(index, 'quantity_ordered', parseInt(e.target.value) || 0)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Prix"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                    min="0"
                  />
                  <div className="w-28 text-sm font-semibold py-1">
                    {item.subtotal.toLocaleString('fr-FR')} FCFA
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remise (FCFA)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxe (FCFA)</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Livraison prévue</label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
            <textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Total</span>
              <span className="font-semibold">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Remise</span>
              <span className="text-red-600">- {discount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Taxe</span>
              <span className="text-green-600">+ {tax.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Net à payer</span>
              <span>{netAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCreatePO}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer la commande
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPO(null);
        }}
        title="Détails de la commande"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Numéro</p>
                <p className="font-semibold">{selectedPO.po_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fournisseur</p>
                <p className="font-semibold">{selectedPO.supplier_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {selectedPO.po_date ? new Date(selectedPO.po_date).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Livraison prévue</p>
                <p className="font-semibold">
                  {selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <div>{getStatusBadge(selectedPO.status)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Articles</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Commandée</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reçue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prix</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedPO.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">{item.product_name}</td>
                        <td className="px-4 py-2 text-sm">{item.quantity_ordered}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{item.quantity_received || 0}</td>
                        <td className="px-4 py-2 text-sm">{item.unit_price.toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-4 py-2 text-sm font-semibold">{item.subtotal.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span>Total</span>
                <span>{selectedPO.total_amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Remise</span>
                <span className="text-red-600">- {(selectedPO.discount || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taxe</span>
                <span className="text-green-600">+ {(selectedPO.tax || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Net</span>
                <span>{selectedPO.net_amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {selectedPO.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-sm">{selectedPO.notes}</p>
              </div>
            )}

            {selectedPO.payment_terms && (
              <div>
                <p className="text-sm text-gray-600">Conditions de paiement</p>
                <p className="text-sm">{selectedPO.payment_terms}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          setSelectedPO(null);
        }}
        title="Réceptionner les marchandises"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Commande: <strong>{selectedPO.po_number}</strong>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Fournisseur: {selectedPO.supplier_name || 'N/A'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Articles à réceptionner</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {receiveItems.map((item, index) => {
                  const remaining = item.quantity_ordered - item.quantity_received;
                  return (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-gray-600">
                            Commandée: {item.quantity_ordered} | Déjà reçue: {item.quantity_received} | Restante: {remaining}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 w-32">Qté à réceptionner:</label>
                        <input
                          type="number"
                          value={item.quantity_to_receive}
                          onChange={(e) => handleReceiveQuantityChange(index, parseInt(e.target.value) || 0)}
                          className="flex-1 border border-gray-300 rounded px-3 py-2"
                          min="0"
                          max={remaining}
                        />
                        <button
                          onClick={() => handleReceiveQuantityChange(index, remaining)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Tout
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ La réception mettra automatiquement à jour le stock des produits concernés.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedPO(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReceiveGoods}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Package size={18} />
                Réceptionner
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default PurchaseOrders;
