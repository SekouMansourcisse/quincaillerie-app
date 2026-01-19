import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import { useToast } from '../context/ToastContext';
import { quotationService, QuotationStats } from '../services/quotationService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { Quotation, QuotationItem, Product, Customer } from '../types';
import {
  FileText,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Send,
  RefreshCw
} from 'lucide-react';

const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<QuotationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const toast = useToast();

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Create form
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [validityDays, setValidityDays] = useState(30);

  // Convert form
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');

  useEffect(() => {
    loadQuotations();
    loadStats();
  }, [currentPage, filterStatus, startDate, endDate]);

  useEffect(() => {
    if (showCreateModal) {
      loadCustomers();
      loadProducts();
    }
  }, [showCreateModal]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const { data, pagination } = await quotationService.getAllQuotations({
        status: filterStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setQuotations(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les devis');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await quotationService.getStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await customerService.getAllCustomers({ page: 1, limit: 1000 });
      setCustomers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await productService.getAllProducts({ page: 1, limit: 1000 });
      setProducts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const handleAddItem = () => {
    setQuotationItems([
      ...quotationItems,
      {
        product_id: undefined,
        product_name: '',
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        description: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...quotationItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Si c'est un produit sélectionné, remplir automatiquement
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.selling_price;
        newItems[index].description = product.description || '';
      }
    }

    // Calculer le sous-total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
    }

    setQuotationItems(newItems);
  };

  const calculateTotals = () => {
    const totalAmount = quotationItems.reduce((sum, item) => sum + item.subtotal, 0);
    const netAmount = totalAmount - discount + tax;
    return { totalAmount, netAmount };
  };

  const handleCreateQuotation = async () => {
    if (quotationItems.length === 0) {
      toast.error('Veuillez ajouter au moins un article');
      return;
    }

    if (quotationItems.some(item => !item.product_name || item.quantity <= 0 || item.unit_price <= 0)) {
      toast.error('Veuillez remplir tous les champs correctement');
      return;
    }

    try {
      await quotationService.createQuotation({
        customer_id: selectedCustomer,
        items: quotationItems,
        discount,
        tax,
        notes,
        terms_conditions: termsConditions,
        validity_days: validityDays
      });

      toast.success('Devis créé avec succès');
      resetCreateForm();
      setShowCreateModal(false);
      loadQuotations();
      loadStats();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création du devis');
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomer(undefined);
    setQuotationItems([]);
    setDiscount(0);
    setTax(0);
    setNotes('');
    setTermsConditions('');
    setValidityDays(30);
  };

  const handleViewDetails = async (quotation: Quotation) => {
    try {
      const fullQuotation = await quotationService.getQuotationById(quotation.id!);
      setSelectedQuotation(fullQuotation);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await quotationService.updateStatus(id, status);
      toast.success('Statut mis à jour avec succès');
      loadQuotations();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleOpenConvertModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowConvertModal(true);
  };

  const handleConvertToSale = async () => {
    if (!selectedQuotation) return;

    try {
      await quotationService.convertToSale(selectedQuotation.id!, {
        payment_method: paymentMethod,
        payment_status: paymentStatus
      });

      toast.success('Devis converti en vente avec succès');
      setShowConvertModal(false);
      setSelectedQuotation(null);
      loadQuotations();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la conversion');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      await quotationService.deleteQuotation(id);
      toast.success('Devis supprimé avec succès');
      loadQuotations();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Envoyé' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepté' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
      expired: { color: 'bg-orange-100 text-orange-800', label: 'Expiré' },
      converted: { color: 'bg-purple-100 text-purple-800', label: 'Converti' }
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Gérez vos propositions commerciales</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span>Nouveau devis</span>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total devis</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total_quotations ?? 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.draft_count ?? 0} brouillons · {stats.sent_count ?? 0} envoyés
                  </p>
                </div>
                <FileText className="text-blue-600 flex-shrink-0" size={32} />
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
                    {stats.expired_count ?? 0} expirés · {stats.rejected_count ?? 0} rejetés
                  </p>
                </div>
                <DollarSign className="text-green-600 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Taux de conversion</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.conversion_rate ?? 0}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.converted_count ?? 0} convertis · {(stats.converted_value ?? 0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <TrendingUp className="text-purple-600 flex-shrink-0" size={32} />
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
                <option value="sent">Envoyé</option>
                <option value="accepted">Accepté</option>
                <option value="rejected">Rejeté</option>
                <option value="expired">Expiré</option>
                <option value="converted">Converti</option>
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
          <div className="md:hidden bg-gray-50 dark:bg-gray-700 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 text-center">
            ← Faites défiler horizontalement →
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">N° Devis</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Validité</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aucun devis trouvé
                    </td>
                  </tr>
                ) : (
                  quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                        {quotation.quotation_number}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {quotation.customer_name || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {quotation.net_amount.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {getStatusBadge(quotation.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewDetails(quotation)}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-target"
                            title="Voir détails"
                          >
                            <Eye size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {quotation.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(quotation.id!, 'sent')}
                                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-target"
                                title="Marquer comme envoyé"
                              >
                                <Send size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(quotation.id!)}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                                title="Supprimer"
                              >
                                <Trash2 size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </>
                          )}
                          {(quotation.status === 'sent' || quotation.status === 'accepted') && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(quotation.id!, 'accepted')}
                                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-target"
                                title="Accepter"
                              >
                                <CheckCircle size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(quotation.id!, 'rejected')}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                                title="Rejeter"
                              >
                                <XCircle size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleOpenConvertModal(quotation)}
                                className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors touch-target"
                                title="Convertir en vente"
                              >
                                <RefreshCw size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </>
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
        title="Créer un nouveau devis"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (optionnel)</label>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
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
              {quotationItems.map((item, index) => (
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
                          {product.name} - {product.selling_price} FCFA
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Validité (jours)</label>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              min="1"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions générales</label>
            <textarea
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
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
              onClick={handleCreateQuotation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer le devis
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuotation(null);
        }}
        title="Détails du devis"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Numéro</p>
                <p className="font-semibold">{selectedQuotation.quotation_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-semibold">{selectedQuotation.customer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {selectedQuotation.quotation_date ? new Date(selectedQuotation.quotation_date).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valide jusqu'au</p>
                <p className="font-semibold">
                  {selectedQuotation.valid_until ? new Date(selectedQuotation.valid_until).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <div>{getStatusBadge(selectedQuotation.status)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Articles</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qté</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prix</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedQuotation.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm">{item.product_name}</td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
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
                <span>{selectedQuotation.total_amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Remise</span>
                <span className="text-red-600">- {(selectedQuotation.discount || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taxe</span>
                <span className="text-green-600">+ {(selectedQuotation.tax || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Net</span>
                <span>{selectedQuotation.net_amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-sm">{selectedQuotation.notes}</p>
              </div>
            )}

            {selectedQuotation.terms_conditions && (
              <div>
                <p className="text-sm text-gray-600">Conditions générales</p>
                <p className="text-sm">{selectedQuotation.terms_conditions}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setSelectedQuotation(null);
        }}
        title="Convertir en vente"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Vous allez convertir le devis <strong>{selectedQuotation.quotation_number}</strong> en vente.
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Montant: {selectedQuotation.net_amount.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement</option>
                <option value="check">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut du paiement</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="partial">Partiel</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setSelectedQuotation(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConvertToSale}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Convertir en vente
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Quotations;
