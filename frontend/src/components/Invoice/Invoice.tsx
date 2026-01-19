import React, { forwardRef } from 'react';
import { Sale, SaleItem } from '../../types';
import { useCompanySettings } from '../../context/CompanySettingsContext';

interface InvoiceProps {
  sale: Sale;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(({ sale, companyInfo }, ref) => {
  const { settings } = useCompanySettings();
  const activeCompanyInfo = companyInfo || settings;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('fr-FR');
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      transfer: 'Virement',
      check: 'Chèque'
    };
    return labels[method] || method;
  };

  return (
    <div
      ref={ref}
      className="bg-white p-8 max-w-[800px] mx-auto text-black"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{activeCompanyInfo.name}</h1>
          <p className="text-gray-600 mt-1">{activeCompanyInfo.address}</p>
          <p className="text-gray-600">Tél: {activeCompanyInfo.phone}</p>
          <p className="text-gray-600">{activeCompanyInfo.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-primary-600">FACTURE</h2>
          <p className="text-gray-600 mt-2">N° {sale.sale_number}</p>
          <p className="text-gray-600">Date: {formatDate(sale.sale_date || sale.created_at)}</p>
        </div>
      </div>

      {/* Informations client (si disponible) */}
      {sale.customer_id && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Client</h3>
          <p className="text-gray-600">ID Client: {sale.customer_id}</p>
        </div>
      )}

      {/* Tableau des articles */}
      <table className="w-full mb-6">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="py-3 px-4 text-left">Article</th>
            <th className="py-3 px-4 text-center">Qté</th>
            <th className="py-3 px-4 text-right">Prix unit.</th>
            <th className="py-3 px-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item: SaleItem, index: number) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-3 px-4 border-b border-gray-200">{item.product_name}</td>
              <td className="py-3 px-4 text-center border-b border-gray-200">{item.quantity}</td>
              <td className="py-3 px-4 text-right border-b border-gray-200">{formatCurrency(item.unit_price)}</td>
              <td className="py-3 px-4 text-right border-b border-gray-200 font-semibold">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Sous-total</span>
            <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
          </div>
          {(sale.discount || 0) > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
              <span>Remise</span>
              <span>-{formatCurrency(sale.discount || 0)}</span>
            </div>
          )}
          {(sale.tax || 0) > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">TVA</span>
              <span>{formatCurrency(sale.tax || 0)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 text-xl font-bold bg-gray-800 text-white px-4 mt-2 rounded">
            <span>TOTAL</span>
            <span>{formatCurrency(sale.net_amount)}</span>
          </div>
        </div>
      </div>

      {/* Mode de paiement */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800">
          <span className="font-semibold">Mode de paiement:</span> {getPaymentMethodLabel(sale.payment_method)}
          {sale.payment_status === 'paid' && ' - Payé'}
          {sale.payment_status === 'pending' && ' - En attente'}
          {sale.payment_status === 'partial' && ' - Paiement partiel'}
        </p>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            <span className="font-semibold">Notes:</span> {sale.notes}
          </p>
        </div>
      )}

      {/* Pied de page */}
      <div className="mt-8 pt-6 border-t-2 border-gray-300 text-center text-gray-500 text-sm">
        <p className="font-semibold mb-2">Merci pour votre confiance !</p>
        <p>{activeCompanyInfo.name} - {activeCompanyInfo.phone}</p>
        <p className="mt-2 text-xs">Cette facture a été générée automatiquement</p>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';

export default Invoice;
