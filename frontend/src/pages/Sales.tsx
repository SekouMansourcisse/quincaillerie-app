import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout/Layout';
import { useToast } from '../context/ToastContext';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import { Product, SaleItem } from '../types';
import { Plus, Trash2, ShoppingCart, Barcode, Keyboard, Search } from 'lucide-react';

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'check'>('cash');
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'search' | 'barcode'>('search');
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
  }, [cartItems, loading, searchTerm, scanMode]);

  // Focus automatique sur le champ de recherche au montage
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await productService.getAllProducts({ is_active: true, limit: 1000 }); // Load enough products for POS
      setProducts(result.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Impossible de charger les produits');
    }
  };

  const addToCart = (product: Product) => {
    // Vérifier si le produit est en stock
    if ((product.current_stock || 0) <= 0) {
      toast.warning(`${product.name} est en rupture de stock`);
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product.id);

    if (existingItem) {
      // Vérifier si on peut ajouter une unité de plus
      if (existingItem.quantity >= (product.current_stock || 0)) {
        toast.warning(`Stock insuffisant pour ${product.name}`);
        return;
      }
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
      toast.success(`${product.name} ajouté au panier`);
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
      toast.success(`${product.name} ajouté au panier`);
    }

    // Vider la recherche après ajout et refocus
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  // Fonction pour gérer le scan de code-barres ou la recherche rapide
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();

      // En mode code-barres, chercher par code-barres exact
      if (scanMode === 'barcode') {
        const product = products.find(p => p.barcode === searchTerm.trim());
        if (product) {
          addToCart(product);
        } else {
          toast.error(`Aucun produit trouvé avec le code-barres: ${searchTerm}`);
          setSearchTerm('');
        }
      } else {
        // En mode recherche, chercher par nom ou référence
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
      await saleService.createSale({
        total_amount: calculateTotal(),
        discount,
        net_amount: calculateNetAmount(),
        payment_method: paymentMethod,
        payment_status: 'paid',
        items: cartItems
      });

      toast.success('Vente enregistrée avec succès !');
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
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
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
            <h1 className="text-3xl font-bold text-gray-900">Point de vente</h1>
            <p className="text-gray-600 mt-1">Effectuez une nouvelle vente</p>
          </div>

          {/* Aide raccourcis clavier */}
          <div className="hidden lg:block bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard size={16} className="text-primary-600" />
              <span className="font-semibold">Raccourcis</span>
            </div>
            <div className="space-y-1">
              <div><kbd className="px-2 py-0.5 bg-white rounded border">F2</kbd> Focus recherche</div>
              <div><kbd className="px-2 py-0.5 bg-white rounded border">F3</kbd> Mode scan</div>
              <div><kbd className="px-2 py-0.5 bg-white rounded border">Ctrl+⏎</kbd> Valider</div>
              <div><kbd className="px-2 py-0.5 bg-white rounded border">Esc</kbd> Effacer</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="card">
              {/* Champ de recherche / scan code-barres */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    {scanMode === 'barcode' ? (
                      <Barcode size={18} className="text-primary-600" />
                    ) : (
                      <Search size={18} className="text-gray-400" />
                    )}
                    <span className="font-medium text-gray-700">
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
                {scanMode === 'barcode' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Appuyez sur Entrée après avoir scanné le code-barres
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.reference}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(product.selling_price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.current_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold">Panier</h2>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                {cartItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Panier vide</p>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{item.product_name}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-700"
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
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">×</span>
                        <span className="text-sm">{formatCurrency(item.unit_price)}</span>
                        <span className="ml-auto font-semibold">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remise</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(calculateNetAmount())}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  {loading ? 'Enregistrement...' : (
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
    </Layout>
  );
};

export default Sales;
