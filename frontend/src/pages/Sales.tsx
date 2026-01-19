import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout/Layout';
import { useToast } from '../context/ToastContext';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { Product, SaleItem, Sale } from '../types';
import { Trash2, ShoppingCart, Barcode, Keyboard, Search, CheckCircle, Printer, MessageCircle, X } from 'lucide-react';
import InvoiceModal from '../components/Invoice/InvoiceModal';

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'search' | 'barcode'>('search');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si un modal est ouvert
      if (showSuccessModal || showInvoiceModal) return;

      // Ctrl/Cmd + Enter : Valider la vente
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (cartItems.length > 0 && !loading) {
          handleCheckout();
        }
      }

      // F2 : Focus sur la recherche
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // F3 : Basculer mode recherche/code-barres
      if (e.key === 'F3') {
        e.preventDefault();
        setScanMode(prev => prev === 'search' ? 'barcode' : 'search');
        toast.info(`Mode ${scanMode === 'search' ? 'code-barres' : 'recherche'} activé`);
      }

      // Échap : Vider la recherche
      if (e.key === 'Escape' && searchTerm) {
        e.preventDefault();
        setSearchTerm('');
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cartItems, loading, searchTerm, scanMode, showSuccessModal, showInvoiceModal]);

  // Focus automatique sur le champ de recherche au montage
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await productService.getAllProducts({ is_active: true, limit: 1000 });
      setProducts(Array.isArray(result) ? result : result.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Impossible de charger les produits');
    }
  };

  const addToCart = (product: Product) => {
    if ((product.current_stock || 0) <= 0) {
      toast.warning(`${product.name} est en rupture de stock`);
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= (product.current_stock || 0)) {
        toast.warning(`Stock insuffisant pour ${product.name}`);
        return;
      }
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.selling_price,
          subtotal: product.selling_price
        }
      ]);
    }

    toast.success(`${product.name} ajouté`);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();

      if (scanMode === 'barcode') {
        const product = products.find(p => p.barcode === searchTerm.trim());
        if (product) {
          addToCart(product);
        } else {
          toast.error(`Aucun produit trouvé avec ce code-barres`);
          setSearchTerm('');
        }
      } else {
        const product = products.find(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (product) {
          addToCart(product);
        } else {
          toast.warning('Aucun produit trouvé');
        }
      }
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCartItems(cartItems.map((item, i) =>
      i === index
        ? { ...item, quantity, subtotal: quantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateNetAmount = () => {
    return calculateTotal() - discount;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.warning('Le panier est vide');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        total_amount: calculateTotal(),
        discount,
        net_amount: calculateNetAmount(),
        payment_method: paymentMethod,
        payment_status: 'paid' as const,
        items: cartItems
      };

      const response = await saleService.createSale(saleData);

      if (!response || !response.id) {
        throw new Error('ID de vente non reçu');
      }

      // Récupérer les détails de la vente créée
      const createdSale = await saleService.getSaleById(response.id);
      setLastSale(createdSale);
      setShowSuccessModal(true);

      // Réinitialiser le panier
      setCartItems([]);
      setDiscount(0);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement de la vente');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  const handleNewSale = () => {
    setShowSuccessModal(false);
    setLastSale(null);
    searchInputRef.current?.focus();
  };

  const handlePrintInvoice = () => {
    setShowSuccessModal(false);
    setShowInvoiceModal(true);
  };

  const handleWhatsAppShare = () => {
    if (!lastSale) return;

    let message = `🧾 *FACTURE N° ${lastSale.sale_number}*\n\n`;
    message += `📋 *Articles:*\n`;

    lastSale.items?.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name} x${item.quantity} = ${formatCurrency(item.subtotal)}\n`;
    });

    message += `\n✅ *TOTAL: ${formatCurrency(lastSale.net_amount)}*\n`;
    message += `\n_Merci pour votre achat !_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Point de vente</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Effectuez une nouvelle vente</p>
          </div>

          {/* Aide raccourcis clavier */}
          <div className="hidden lg:block bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard size={16} className="text-primary-600" />
              <span className="font-semibold">Raccourcis</span>
            </div>
            <div className="space-y-1">
              <div><kbd className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">F2</kbd> Focus recherche</div>
              <div><kbd className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">F3</kbd> Mode scan</div>
              <div><kbd className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded border dark:border-gray-600">Ctrl+⏎</kbd> Valider</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              {/* Champ de recherche */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    {scanMode === 'barcode' ? (
                      <Barcode size={18} className="text-primary-600" />
                    ) : (
                      <Search size={18} className="text-gray-400" />
                    )}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {scanMode === 'barcode' ? 'Scan code-barres' : 'Recherche produit'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setScanMode(prev => prev === 'search' ? 'barcode' : 'search');
                      searchInputRef.current?.focus();
                    }}
                    className="ml-auto text-xs btn btn-secondary py-1 px-2"
                  >
                    Basculer (F3)
                  </button>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    scanMode === 'barcode'
                      ? "Scannez ou saisissez le code-barres..."
                      : "Rechercher par nom ou référence..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchSubmit}
                  className={`input ${scanMode === 'barcode' ? 'font-mono' : ''}`}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all animate-fade-in
                      ${(product.current_stock || 0) > 0
                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.reference}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(product.selling_price)}
                      </span>
                      <span className={`text-sm ${(product.current_stock || 0) > 5 ? 'text-gray-500' : 'text-red-500'}`}>
                        Stock: {product.current_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panier */}
          <div className="space-y-4">
            <div className="card sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Panier</h2>
                <span className="ml-auto bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full text-sm font-medium">
                  {cartItems.length} article{cartItems.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin mb-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Panier vide</p>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-scale-in">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{item.product_name}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded text-center"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">×</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.unit_price)}</span>
                        <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Sous-total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculateTotal())}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Remise</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded text-right"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between text-xl font-bold border-t dark:border-gray-700 pt-3">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary-600 dark:text-primary-400">{formatCurrency(calculateNetAmount())}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="input"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte</option>
                    <option value="transfer">Virement</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0 || loading}
                  className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      Valider la vente
                      <span className="text-sm opacity-75">(Ctrl+⏎)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès après vente */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleNewSale} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <button
              onClick={handleNewSale}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vente enregistrée !</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Facture N° <span className="font-semibold">{lastSale.sale_number}</span>
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(lastSale.net_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{lastSale.items?.length || 0} article(s)</span>
                <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePrintInvoice}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Voir / Imprimer la facture
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="w-full btn flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle size={20} />
                Envoyer sur WhatsApp
              </button>

              <button
                onClick={handleNewSale}
                className="w-full btn btn-secondary"
              >
                Nouvelle vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Facture */}
      {lastSale && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          sale={lastSale}
        />
      )}
    </Layout>
  );
};

export default Sales;
