import React, { useRef, useState } from 'react';
import { X, Printer, Download, MessageCircle, FileText, Loader2 } from 'lucide-react';
import { Sale } from '../../types';
import Invoice from './Invoice';
import { useToast } from '../../context/ToastContext';
import { downloadInvoicePDF, downloadInvoiceHTML } from '../../utils/pdfExport';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  // Fonction d'impression
  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les popups.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${sale.sale_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; }
            th { background-color: #1f2937; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-800 { color: #1f2937; }
            .text-green-600 { color: #059669; }
            .text-green-800 { color: #065f46; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-800 { background-color: #1f2937; color: white; }
            .bg-green-50 { background-color: #ecfdf5; }
            .bg-yellow-50 { background-color: #fffbeb; }
            .rounded-lg { border-radius: 8px; }
            .p-4 { padding: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-2 { margin-top: 8px; }
            .mt-8 { margin-top: 32px; }
            .pt-6 { padding-top: 24px; }
            .pb-6 { padding-bottom: 24px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .border-t-2 { border-top: 2px solid #d1d5db; }
            .border-b-2 { border-bottom: 2px solid #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-green-200 { border-color: #a7f3d0; }
            .w-72 { width: 288px; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-3xl { font-size: 1.875rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-start { align-items: flex-start; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success('Impression lancée');
  };

  // Générer le texte pour WhatsApp
  const generateWhatsAppMessage = () => {
    let message = `🧾 *FACTURE N° ${sale.sale_number}*\n`;
    message += `📅 Date: ${new Date(sale.sale_date || sale.created_at || '').toLocaleDateString('fr-FR')}\n\n`;
    message += `📋 *Détail des articles:*\n`;
    message += `${'─'.repeat(30)}\n`;

    sale.items?.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   ${item.quantity} x ${formatCurrency(item.unit_price)} = *${formatCurrency(item.subtotal)}*\n`;
    });

    message += `${'─'.repeat(30)}\n`;
    message += `💰 Sous-total: ${formatCurrency(sale.total_amount)}\n`;

    if ((sale.discount || 0) > 0) {
      message += `🏷️ Remise: -${formatCurrency(sale.discount || 0)}\n`;
    }

    message += `\n✅ *TOTAL À PAYER: ${formatCurrency(sale.net_amount)}*\n\n`;
    message += `💳 Mode de paiement: ${getPaymentMethodLabel(sale.payment_method)}\n`;
    message += `\n_Merci pour votre confiance !_\n`;
    message += `_Quincaillerie Moderne_`;

    return encodeURIComponent(message);
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

  // Partager sur WhatsApp
  const handleWhatsAppShare = (phoneNumber?: string) => {
    const message = generateWhatsAppMessage();
    let url = `https://wa.me/${phoneNumber || ''}?text=${message}`;

    if (!phoneNumber) {
      // Ouvrir WhatsApp sans numéro pré-rempli
      url = `https://api.whatsapp.com/send?text=${message}`;
    }

    window.open(url, '_blank');
    toast.success('Ouverture de WhatsApp...');
  };

  // Telecharger en PDF (via impression)
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      setShowExportMenu(false);
      await downloadInvoicePDF(sale);
      toast.success('Dialogue d\'impression/PDF ouvert');
    } catch (error) {
      console.error('Erreur lors du telechargement PDF:', error);
      toast.error('Erreur lors de la generation du PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Telecharger en HTML
  const handleDownloadHTML = () => {
    try {
      setShowExportMenu(false);
      downloadInvoiceHTML(sale);
      toast.success('Facture HTML telechargee');
    } catch (error) {
      console.error('Erreur lors du telechargement HTML:', error);
      toast.error('Erreur lors du telechargement');
    }
  };

  // Copier le texte de la facture
  const handleCopyText = () => {
    let text = `FACTURE N° ${sale.sale_number}\n`;
    text += `Date: ${new Date(sale.sale_date || sale.created_at || '').toLocaleDateString('fr-FR')}\n\n`;
    text += `Détail des articles:\n`;
    text += `${'─'.repeat(40)}\n`;

    sale.items?.forEach((item, index) => {
      text += `${index + 1}. ${item.product_name}\n`;
      text += `   ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}\n`;
    });

    text += `${'─'.repeat(40)}\n`;
    text += `Sous-total: ${formatCurrency(sale.total_amount)}\n`;

    if ((sale.discount || 0) > 0) {
      text += `Remise: -${formatCurrency(sale.discount || 0)}\n`;
    }

    text += `\nTOTAL: ${formatCurrency(sale.net_amount)}\n`;
    text += `Mode de paiement: ${getPaymentMethodLabel(sale.payment_method)}\n`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Facture copiée dans le presse-papier');
    }).catch(() => {
      toast.error('Impossible de copier la facture');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Facture N° {sale.sale_number}
          </h2>
          <div className="flex items-center gap-2">
            {/* Menu Export/Telechargement */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="Exporter"
              >
                {downloading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                <span className="hidden sm:inline">Exporter</span>
              </button>

              {/* Dropdown menu */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                  >
                    <FileText size={18} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">PDF</p>
                      <p className="text-xs text-gray-500">Enregistrer en PDF</p>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadHTML}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border-t border-gray-100 dark:border-gray-700"
                  >
                    <FileText size={18} className="text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">HTML</p>
                      <p className="text-xs text-gray-500">Fichier web</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleCopyText();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border-t border-gray-100 dark:border-gray-700"
                  >
                    <FileText size={18} className="text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Texte</p>
                      <p className="text-xs text-gray-500">Copier dans le presse-papier</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Bouton WhatsApp */}
            <button
              onClick={() => handleWhatsAppShare()}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              title="Partager sur WhatsApp"
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Bouton Imprimer */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              title="Imprimer"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 bg-gray-100 dark:bg-gray-900">
          <Invoice ref={invoiceRef} sale={sale} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
