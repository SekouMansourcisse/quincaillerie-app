import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  FolderOpen,
  Truck,
  FileText,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Receipt,
  Boxes,
  RotateCcw,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StockAlertNotification from '../common/StockAlertNotification';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/products', icon: Package, label: 'Produits' },
    { path: '/categories', icon: FolderOpen, label: 'Catégories' },
    { path: '/suppliers', icon: Truck, label: 'Fournisseurs' },
    { path: '/inventory', icon: Boxes, label: 'Inventaire' },
    { path: '/sales', icon: ShoppingCart, label: 'Point de vente' },
    { path: '/sales-history', icon: FileText, label: 'Historique ventes' },
    { path: '/returns', icon: RotateCcw, label: 'Retours & Avoirs' },
    { path: '/cash-report', icon: Receipt, label: 'Rapport de caisse' },
    { path: '/statistics', icon: TrendingUp, label: 'Statistiques' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/users', icon: Users, label: 'Utilisateurs' });
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold">Quincaillerie</h1>
                <p className="text-xs text-gray-400">Gestion de stock</p>
              </div>
            )}
          </div>

          {/* Bouton fermer pour mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bouton collapse (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all shadow-lg"
          aria-label={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''} ${
                isCollapsed ? 'justify-center px-3' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="animate-fade-in whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          {/* Alertes de stock (desktop) */}
          <div className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
            {!isCollapsed && (
              <span className="text-sm text-gray-400 animate-fade-in">Alertes</span>
            )}
            <StockAlertNotification refreshInterval={60000} />
          </div>

          {/* Toggle thème */}
          <button
            onClick={toggleTheme}
            className={`sidebar-item w-full ${isCollapsed ? 'justify-center px-3' : ''}`}
            title={isCollapsed ? (isDark ? 'Mode clair' : 'Mode sombre') : undefined}
          >
            {isDark ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-blue-400" />
            )}
            {!isCollapsed && (
              <span className="animate-fade-in">
                {isDark ? 'Mode clair' : 'Mode sombre'}
              </span>
            )}
          </button>

          {/* Profil utilisateur */}
          <div className={`flex items-center gap-3 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold shadow-lg">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium truncate">
                  {user?.first_name || user?.username}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            )}
          </div>

          {/* Déconnexion */}
          <button
            onClick={logout}
            className={`sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 ${
              isCollapsed ? 'justify-center px-3' : ''
            }`}
            title={isCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="animate-fade-in">Déconnexion</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
