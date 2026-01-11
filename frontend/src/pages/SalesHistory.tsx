import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { saleService } from '../services/saleService';
import { Sale } from '../types';
import { Eye, FileText, Calendar, Download, Printer } from 'lucide-react';
import { exportSalesToCSV, printInvoice } from '../utils/exportUtils';
import Pagination from '../components/common/Pagination';

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);
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
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
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
      paid: { label: 'Payé', class: 'bg-green-100 text-green-800' },
      pending: { label: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Partiel', class: 'bg-orange-100 text-orange-800' }
    };
    const s = statusMap[status] || statusMap.paid;
    return <span className={`px-2 py-1 rounded-full text-sm ${s.class}`}>{s.label}</span>;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique des ventes</h1>
            <p className="text-gray-600 mt-1">Consultez l'historique de toutes les ventes</p>
          </div>
          <button
            onClick={() => exportSalesToCSV(sales)}
            disabled={sales.length === 0}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download size={20} />
            Exporter CSV
          </button>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
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

          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aucune vente trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Vente</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Mode paiement</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-medium">{sale.sale_number}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {formatDate(sale.sale_date || sale.created_at || '')}
                        </div>
                      </td>
                      <td className="font-semibold text-primary-600">
                        {formatCurrency(sale.net_amount)}
                      </td>
                      <td>{getPaymentMethodLabel(sale.payment_method)}</td>
                      <td>{getPaymentStatusBadge(sale.payment_status)}</td>
                      <td>
                        <button
                          onClick={() => viewSaleDetails(sale.id!)}
                          className="btn btn-secondary flex items-center gap-2 py-1 px-3"
                        >
                          <Eye size={16} />
                          Détails
                        </button>
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

      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Détails de la vente</h2>
              <p className="text-gray-600">N° {selectedSale.sale_number}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">
                    {formatDate(selectedSale.sale_date || selectedSale.created_at || '')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <div>{getPaymentStatusBadge(selectedSale.payment_status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mode de paiement</p>
                  <p className="font-semibold">{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="font-semibold text-lg text-primary-600">
                    {formatCurrency(selectedSale.net_amount)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Articles vendus</h3>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">Produit</th>
                      <th className="px-4 py-2 text-right text-sm">Qté</th>
                      <th className="px-4 py-2 text-right text-sm">Prix unitaire</th>
                      <th className="px-4 py-2 text-right text-sm">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.product_name}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                      <td className="px-4 py-2 text-right text-lg text-primary-600">
                        {formatCurrency(selectedSale.total_amount)}
                      </td>
                    </tr>
                    {selectedSale.discount! > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right">Remise</td>
                        <td className="px-4 py-2 text-right text-red-600">
                          -{formatCurrency(selectedSale.discount!)}
                        </td>
                      </tr>
                    )}
                    <tr className="text-lg">
                      <td colSpan={3} className="px-4 py-2 text-right">Net à payer</td>
                      <td className="px-4 py-2 text-right text-primary-600">
                        {formatCurrency(selectedSale.net_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedSale.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-gray-800">{selectedSale.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-4">
              <button
                onClick={() => printInvoice(selectedSale)}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Imprimer la facture
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SalesHistory;
