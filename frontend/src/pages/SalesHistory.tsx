import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { saleService } from '../services/saleService';
import { Sale } from '../types';
import { Eye, FileText, Calendar, Download, Printer, MessageCircle } from 'lucide-react';
import { exportSalesToCSV } from '../utils/exportUtils';
import Pagination from '../components/common/Pagination';
import InvoiceModal from '../components/Invoice/InvoiceModal';

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    payment_status: ''
  });

  useEffect(() => {
    loadSales();
  }, [currentPage]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const filterParams: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE
      };
      if (filters.start_date) filterParams.start_date = filters.start_date;
      if (filters.end_date) filterParams.end_date = filters.end_date;
      if (filters.payment_status) filterParams.payment_status = filters.payment_status;

      const result = await saleService.getAllSales(filterParams);
      setSales(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const viewSaleDetails = async (id: number) => {
    try {
      const sale = await saleService.getSaleById(id);
      setSelectedSale(sale);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: any = {
      paid: { label: 'Payé', class: 'badge-success' },
      pending: { label: 'En attente', class: 'badge-warning' },
      partial: { label: 'Partiel', class: 'badge-danger' }
    };
    const s = statusMap[status] || statusMap.paid;
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: any = {
      cash: 'Espèces',
      card: 'Carte',
      transfer: 'Virement',
      check: 'Chèque'
    };
    return methods[method] || method;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historique des ventes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Consultez et imprimez vos factures</p>
          </div>
          <button
            onClick={() => exportSalesToCSV(sales)}
            disabled={sales.length === 0}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Exporter CSV
          </button>
        </div>

        <div className="card">
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date début</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date fin</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
              <select
                value={filters.payment_status}
                onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                className="input"
              >
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="partial">Partiel</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setCurrentPage(1); loadSales(); }} className="btn btn-primary w-full">
                Filtrer
              </button>
            </div>
          </div>

          {/* Tableau */}
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Aucune vente trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Vente</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Paiement</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => (
                    <tr
                      key={sale.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="font-medium text-gray-900 dark:text-white">{sale.sale_number}</td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Calendar size={16} className="text-gray-400" />
                          {formatDate(sale.sale_date || sale.created_at || '')}
                        </div>
                      </td>
                      <td className="font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(sale.net_amount)}
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">{getPaymentMethodLabel(sale.payment_method)}</td>
                      <td>{getPaymentStatusBadge(sale.payment_status)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewSaleDetails(sale.id!)}
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Voir la facture"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => viewSaleDetails(sale.id!)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Imprimer"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && sales.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Modal Facture */}
      {selectedSale && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
        />
      )}
    </Layout>
  );
};

export default SalesHistory;
