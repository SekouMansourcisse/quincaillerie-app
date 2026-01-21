import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';

interface StockAlertNotificationProps {
  refreshInterval?: number; // Intervalle de rafraîchissement en ms (par défaut 60 secondes)
}

const StockAlertNotification: React.FC<StockAlertNotificationProps> = ({
  refreshInterval = 60000
}) => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadLowStockProducts = async () => {
    try {
      setLoading(true);
      const products = await productService.getLowStockProducts();
      setLowStockProducts(products);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des alertes de stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial et rafraîchissement périodique
  useEffect(() => {
    loadLowStockProducts();

    const interval = setInterval(loadLowStockProducts, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStockLevel = (product: Product) => {
    const currentStock = product.current_stock ?? 0;
    const minStock = product.min_stock ?? 1;
    const ratio = currentStock / minStock;
    if (ratio === 0) return 'critical';
    if (ratio <= 0.5) return 'danger';
    return 'warning';
  };

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'danger':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const handleProductClick = (product: Product) => {
    setIsOpen(false);
    navigate('/inventory', { state: { productId: product.id } });
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/products', { state: { lowStock: true } });
  };

  const criticalCount = lowStockProducts.filter(p => p.current_stock === 0).length;
  const hasAlerts = lowStockProducts.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          hasAlerts
            ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="Alertes de stock"
        title={hasAlerts ? `${lowStockProducts.length} produit(s) en stock faible` : 'Aucune alerte'}
      >
        <Bell size={20} className={hasAlerts ? 'animate-pulse' : ''} />

        {/* Badge de notification */}
        {hasAlerts && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white rounded-full ${
            criticalCount > 0 ? 'bg-red-500' : 'bg-orange-500'
          }`}>
            {lowStockProducts.length > 99 ? '99+' : lowStockProducts.length}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span className="font-semibold">Alertes de stock</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadLowStockProducts}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                disabled={loading}
                title="Actualiser"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="max-h-[400px] overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-50" />
                <p>Aucune alerte de stock</p>
                <p className="text-sm mt-1">Tous les produits sont en quantité suffisante</p>
              </div>
            ) : (
              <>
                {/* Résumé */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3 text-sm">
                    {criticalCount > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {criticalCount} rupture{criticalCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      {lowStockProducts.length} alerte{lowStockProducts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Liste des produits */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {lowStockProducts.slice(0, 10).map((product) => {
                    const level = getStockLevel(product);
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStockLevelColor(level)}`}>
                          <Package size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`font-semibold ${
                              level === 'critical' ? 'text-red-600 dark:text-red-400' :
                              level === 'danger' ? 'text-orange-600 dark:text-orange-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              Stock: {product.current_stock}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              Min: {product.min_stock}
                            </span>
                          </div>
                        </div>
                        {level === 'critical' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                            Rupture
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                {lowStockProducts.length > 10 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Et {lowStockProducts.length - 10} autre(s) produit(s)...
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {lowStockProducts.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleViewAll}
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Voir tous les produits en stock faible
              </button>
            </div>
          )}

          {/* Dernière mise à jour */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
            <span className="text-xs text-gray-400">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertNotification;
