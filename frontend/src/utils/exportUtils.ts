// Utilitaires pour l'exportation de données

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Obtenir les en-têtes (clés du premier objet)
  const headers = Object.keys(data[0]);

  // Créer le contenu CSV
  const csvContent = [
    headers.join(','), // En-têtes
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et encadrer les valeurs contenant des virgules
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Créer un blob et télécharger
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportSalesToCSV = (sales: any[]) => {
  const salesData = sales.map(sale => ({
    'Numéro de vente': sale.sale_number,
    'Date': new Date(sale.sale_date || sale.created_at).toLocaleDateString('fr-FR'),
    'Montant total': sale.total_amount,
    'Remise': sale.discount || 0,
    'Montant net': sale.net_amount,
    'Mode de paiement': sale.payment_method,
    'Statut': sale.payment_status,
    'Notes': sale.notes || ''
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(salesData, `ventes_${date}`);
};

export const exportProductsToCSV = (products: any[]) => {
  const productsData = products.map(product => ({
    'Nom': product.name,
    'Référence': product.reference || '',
    'Code-barres': product.barcode || '',
    'Catégorie': product.category_name || '',
    'Fournisseur': product.supplier_name || '',
    'Prix d\'achat': product.purchase_price,
    'Prix de vente': product.selling_price,
    'Stock actuel': product.current_stock || 0,
    'Stock minimum': product.min_stock || 0,
    'Unité': product.unit || 'piece',
    'Actif': product.is_active ? 'Oui' : 'Non'
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(productsData, `produits_${date}`);
};

export const exportLowStockToCSV = (products: any[]) => {
  const lowStockData = products.map(product => ({
    'Nom': product.name,
    'Référence': product.reference || '',
    'Catégorie': product.category_name || '',
    'Stock actuel': product.current_stock || 0,
    'Stock minimum': product.min_stock || 0,
    'Différence': (product.min_stock || 0) - (product.current_stock || 0)
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(lowStockData, `stock_faible_${date}`);
};

export const exportInventoryToCSV = (products: any[]) => {
  const inventoryData = products.map(product => ({
    'Nom': product.name,
    'Référence': product.reference || '',
    'Catégorie': product.category_name || '',
    'Fournisseur': product.supplier_name || '',
    'Stock actuel': product.current_stock || 0,
    'Prix d\'achat': product.purchase_price,
    'Valeur du stock': (product.current_stock || 0) * product.purchase_price,
    'Prix de vente': product.selling_price,
    'Valeur potentielle': (product.current_stock || 0) * product.selling_price
  }));

  const date = new Date().toISOString().split('T')[0];
  exportToCSV(inventoryData, `inventaire_${date}`);
};

// Fonction pour imprimer une facture
export const printInvoice = (sale: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour imprimer');
    return;
  }

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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facture ${sale.sale_number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #333;
        }
        .info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info div {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        .total {
          text-align: right;
          margin-top: 20px;
        }
        .total table {
          margin-left: auto;
          width: 300px;
        }
        .total td {
          border: none;
        }
        .total .grand-total {
          font-size: 1.2em;
          font-weight: bold;
          border-top: 2px solid #333;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>QUINCAILLERIE</h1>
        <p>Facture de vente</p>
      </div>

      <div class="info">
        <div>
          <strong>Numéro de facture:</strong> ${sale.sale_number}<br>
          <strong>Date:</strong> ${formatDate(sale.sale_date || sale.created_at)}
        </div>
        <div>
          <strong>Mode de paiement:</strong> ${sale.payment_method === 'cash' ? 'Espèces' : sale.payment_method === 'card' ? 'Carte' : sale.payment_method === 'transfer' ? 'Virement' : 'Chèque'}<br>
          <strong>Statut:</strong> ${sale.payment_status === 'paid' ? 'Payé' : sale.payment_status === 'pending' ? 'En attente' : 'Partiel'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th style="text-align: center">Quantité</th>
            <th style="text-align: right">Prix unitaire</th>
            <th style="text-align: right">Sous-total</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items?.map((item: any) => `
            <tr>
              <td>${item.product_name}</td>
              <td style="text-align: center">${item.quantity}</td>
              <td style="text-align: right">${formatCurrency(item.unit_price)}</td>
              <td style="text-align: right">${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>

      <div class="total">
        <table>
          <tr>
            <td>Sous-total:</td>
            <td style="text-align: right">${formatCurrency(sale.total_amount)}</td>
          </tr>
          ${sale.discount > 0 ? `
          <tr>
            <td>Remise:</td>
            <td style="text-align: right">-${formatCurrency(sale.discount)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td>Total à payer:</td>
            <td style="text-align: right">${formatCurrency(sale.net_amount)}</td>
          </tr>
        </table>
      </div>

      ${sale.notes ? `<p><strong>Notes:</strong> ${sale.notes}</p>` : ''}

      <div class="footer">
        <p>Merci pour votre achat !</p>
        <p>Cette facture a été générée automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
          Imprimer
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
