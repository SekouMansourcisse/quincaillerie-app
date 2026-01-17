import { Sale, SaleItem } from '../types';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Quincaillerie Moderne',
  address: 'Rue du Commerce, Bamako, Mali',
  phone: '+223 XX XX XX XX',
  email: 'contact@quincaillerie.com'
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return new Date().toLocaleDateString('fr-FR');
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    cash: 'Especes',
    card: 'Carte bancaire',
    transfer: 'Virement',
    check: 'Cheque'
  };
  return labels[method] || method;
};

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    paid: 'Paye',
    pending: 'En attente',
    partial: 'Paiement partiel'
  };
  return labels[status] || status;
};

/**
 * Genere le contenu HTML pour le PDF de la facture
 */
const generateInvoiceHTML = (sale: Sale, companyInfo: CompanyInfo = defaultCompanyInfo): string => {
  const itemsRows = sale.items?.map((item: SaleItem, index: number) => `
    <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture ${sale.sale_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1f2937;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 30px;
          border-bottom: 3px solid #3b82f6;
          margin-bottom: 30px;
        }
        .company-info h1 {
          font-size: 28px;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .company-info p {
          color: #6b7280;
          margin: 2px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          font-size: 24px;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .invoice-info p {
          color: #6b7280;
          margin: 4px 0;
        }
        .customer-section {
          background: #f3f4f6;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .customer-section h3 {
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        thead tr {
          background: #1f2937;
          color: white;
        }
        th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 600;
        }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) {
          text-align: center;
        }
        th:nth-child(3), th:nth-child(4) {
          text-align: right;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-box {
          width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row.discount {
          color: #059669;
        }
        .total-row.final {
          background: #1f2937;
          color: white;
          padding: 14px 16px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 16px;
          font-weight: bold;
          border: none;
        }
        .payment-info {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .payment-info p {
          color: #065f46;
        }
        .notes-section {
          background: #fefce8;
          border: 1px solid #fef08a;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .notes-section p {
          color: #854d0e;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
        }
        .footer p {
          margin: 4px 0;
        }
        .footer .thanks {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <h1>${companyInfo.name}</h1>
            <p>${companyInfo.address}</p>
            <p>Tel: ${companyInfo.phone}</p>
            <p>${companyInfo.email}</p>
          </div>
          <div class="invoice-info">
            <h2>FACTURE</h2>
            <p><strong>N:</strong> ${sale.sale_number}</p>
            <p><strong>Date:</strong> ${formatDate(sale.sale_date || sale.created_at)}</p>
          </div>
        </div>

        ${sale.customer_id ? `
        <!-- Client -->
        <div class="customer-section">
          <h3>Client</h3>
          <p>ID Client: ${sale.customer_id}</p>
        </div>
        ` : ''}

        <!-- Tableau des articles -->
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Qte</th>
              <th>Prix unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totaux -->
        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Sous-total</span>
              <span>${formatCurrency(sale.total_amount)}</span>
            </div>
            ${(sale.discount || 0) > 0 ? `
            <div class="total-row discount">
              <span>Remise</span>
              <span>-${formatCurrency(sale.discount || 0)}</span>
            </div>
            ` : ''}
            ${(sale.tax || 0) > 0 ? `
            <div class="total-row">
              <span>TVA</span>
              <span>${formatCurrency(sale.tax || 0)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>TOTAL</span>
              <span>${formatCurrency(sale.net_amount)}</span>
            </div>
          </div>
        </div>

        <!-- Mode de paiement -->
        <div class="payment-info">
          <p><strong>Mode de paiement:</strong> ${getPaymentMethodLabel(sale.payment_method)} - ${getPaymentStatusLabel(sale.payment_status)}</p>
        </div>

        ${sale.notes ? `
        <!-- Notes -->
        <div class="notes-section">
          <p><strong>Notes:</strong> ${sale.notes}</p>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p class="thanks">Merci pour votre confiance !</p>
          <p>${companyInfo.name} - ${companyInfo.phone}</p>
          <p style="font-size: 10px; margin-top: 10px;">Cette facture a ete generee automatiquement</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Telecharge la facture en PDF en utilisant l'API d'impression du navigateur
 * Cette methode ouvre une fenetre d'impression qui permet de sauvegarder en PDF
 */
export const downloadInvoicePDF = (sale: Sale, companyInfo?: CompanyInfo): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const html = generateInvoiceHTML(sale, companyInfo);

      // Creer un iframe cache pour l'impression
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.left = '-9999px';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Impossible de creer le document PDF');
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Attendre que le contenu soit charge
      iframe.onload = () => {
        try {
          // Ouvrir le dialogue d'impression/PDF
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Nettoyer apres un delai
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      // Fallback si onload ne se declenche pas
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve();
          }, 1000);
        } catch (error) {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          reject(error);
        }
      }, 500);

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Genere un Blob HTML de la facture pour telechargement direct
 */
export const generateInvoiceBlob = (sale: Sale, companyInfo?: CompanyInfo): Blob => {
  const html = generateInvoiceHTML(sale, companyInfo);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
};

/**
 * Telecharge la facture en format HTML
 */
export const downloadInvoiceHTML = (sale: Sale, companyInfo?: CompanyInfo): void => {
  const blob = generateInvoiceBlob(sale, companyInfo);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facture-${sale.sale_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  downloadInvoicePDF,
  downloadInvoiceHTML,
  generateInvoiceBlob
};
