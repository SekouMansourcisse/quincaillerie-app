import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import { InputField, TextAreaField, SelectField } from '../components/common/FormField';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { useFormValidation } from '../hooks/useFormValidation';
import { useDebounce } from '../hooks/useDebounce';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import { Product, Category, Supplier } from '../types';
import { Plus, Search, Edit2, Trash2, Package, Download } from 'lucide-react';
import { exportProductsToCSV } from '../utils/exportUtils';
import Pagination from '../components/common/Pagination';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const toast = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const { errors, validateForm, handleBlur, handleChange, resetValidation } = useFormValidation({
    name: { required: true, minLength: 2, maxLength: 100 },
    purchase_price: { required: true, min: 0 },
    selling_price: {
      required: true,
      min: 0,
      custom: (value) => {
        if (formData.purchase_price && parseFloat(value) < formData.purchase_price) {
          return 'Le prix de vente doit être supérieur au prix d\'achat';
        }
        return null;
      }
    },
    current_stock: { min: 0 },
    min_stock: { min: 0 }
  });
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    reference: '',
    barcode: '',
    category_id: undefined,
    supplier_id: undefined,
    purchase_price: 0,
    selling_price: 0,
    current_stock: 0,
    min_stock: 0,
    unit: 'piece'
  });

  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentPage, debouncedSearchTerm]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      toast.error('Impossible de charger les catégories');
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAllSuppliers(true);
      setSuppliers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
      toast.error('Impossible de charger les fournisseurs');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productService.getAllProducts({
        search: debouncedSearchTerm,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setProducts(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm(formData)) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      if (editingProduct?.id) {
        // Mise à jour optimiste
        setProducts(products.map(p =>
          p.id === editingProduct.id ? { ...formData, id: editingProduct.id } as Product : p
        ));
        setShowModal(false);
        resetForm();

        await productService.updateProduct(editingProduct.id, formData);
        toast.success('Produit mis à jour avec succès');

        // Recharger pour avoir les données à jour du serveur
        loadProducts();
      } else {
        // Pour la création, on attend la réponse du serveur pour avoir l'ID
        const newProduct = await productService.createProduct(formData);

        // Ajout optimiste
        setProducts([newProduct, ...products]);
        toast.success('Produit créé avec succès');

        setShowModal(false);
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
      // En cas d'erreur, recharger les données
      loadProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (id: number, productName: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le produit',
      message: `Êtes-vous sûr de vouloir supprimer "${productName}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });

    if (confirmed) {
      // Sauvegarde pour rollback en cas d'erreur
      const previousProducts = [...products];

      try {
        // Suppression optimiste
        setProducts(products.filter(p => p.id !== id));
        toast.success('Produit supprimé avec succès');

        await productService.deleteProduct(id);
      } catch (error: any) {
        // Rollback en cas d'erreur
        setProducts(previousProducts);
        toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reference: '',
      barcode: '',
      purchase_price: 0,
      selling_price: 0,
      current_stock: 0,
      min_stock: 0,
      unit: 'piece'
    });
    setEditingProduct(null);
    resetValidation();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
            <p className="text-gray-600 mt-1">Gérez votre catalogue de produits</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportProductsToCSV(products)}
              disabled={products.length === 0}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download size={20} />
              Exporter CSV
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nouveau produit
            </button>
          </div>
        </div>

        <div className="card">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un produit... (recherche automatique)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Retour à la page 1 lors de la recherche
                }}
                className="input pl-10 pr-10"
              />
              {/* Indicateur de recherche en cours */}
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                Recherche pour : <span className="font-medium">"{searchTerm}"</span>
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Spinner />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchTerm ? "Aucun produit trouvé" : "Aucun produit dans votre catalogue"}
              description={
                searchTerm
                  ? `Aucun résultat pour "${searchTerm}". Essayez un autre terme de recherche.`
                  : "Commencez par ajouter votre premier produit pour gérer votre inventaire."
              }
              action={
                !searchTerm
                  ? {
                    label: "Ajouter un produit",
                    onClick: () => {
                      resetForm();
                      setShowModal(true);
                    },
                    icon: Plus
                  }
                  : undefined
              }
              secondaryAction={
                searchTerm
                  ? {
                    label: "Effacer la recherche",
                    onClick: () => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }
                  }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Référence</th>
                    <th>Prix d'achat</th>
                    <th>Prix de vente</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td>{product.reference || '-'}</td>
                      <td>{formatCurrency(product.purchase_price)}</td>
                      <td>{formatCurrency(product.selling_price)}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded ${(product.current_stock || 0) <= (product.min_stock || 0)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                            }`}
                        >
                          {product.current_stock}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!, product.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            aria-label={`Supprimer ${product.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && products.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField
                id="name"
                label="Nom du produit"
                value={formData.name}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData({ ...formData, name: newValue });
                  handleChange('name', newValue);
                }}
                onBlur={(e) => handleBlur('name', e.target.value)}
                error={errors.name}
                required
                placeholder="Ex: Marteau 500g"
              />
            </div>

            <InputField
              id="reference"
              label="Référence"
              value={formData.reference || ''}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="REF-001"
            />

            <InputField
              id="barcode"
              label="Code-barres"
              value={formData.barcode || ''}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="123456789"
            />

            <SelectField
              label="Catégorie"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Aucune</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </SelectField>

            <SelectField
              label="Fournisseur"
              value={formData.supplier_id || ''}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Aucun</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </SelectField>

            <InputField
              id="purchase_price"
              type="number"
              label="Prix d'achat"
              value={formData.purchase_price}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, purchase_price: newValue });
                handleChange('purchase_price', newValue);
              }}
              onBlur={(e) => handleBlur('purchase_price', parseFloat(e.target.value))}
              error={errors.purchase_price}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              helpText="Prix d'achat unitaire"
            />

            <InputField
              id="selling_price"
              type="number"
              label="Prix de vente"
              value={formData.selling_price}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, selling_price: newValue });
                handleChange('selling_price', newValue);
              }}
              onBlur={(e) => handleBlur('selling_price', parseFloat(e.target.value))}
              error={errors.selling_price}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              helpText="Prix de vente unitaire"
            />

            <InputField
              id="current_stock"
              type="number"
              label="Stock actuel"
              value={formData.current_stock}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                setFormData({ ...formData, current_stock: newValue });
                handleChange('current_stock', newValue);
              }}
              onBlur={(e) => handleBlur('current_stock', parseInt(e.target.value))}
              error={errors.current_stock}
              min="0"
              placeholder="0"
            />

            <InputField
              id="min_stock"
              type="number"
              label="Stock minimum"
              value={formData.min_stock}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                setFormData({ ...formData, min_stock: newValue });
                handleChange('min_stock', newValue);
              }}
              onBlur={(e) => handleBlur('min_stock', parseInt(e.target.value))}
              error={errors.min_stock}
              min="0"
              placeholder="0"
              helpText="Seuil d'alerte"
            />

            <div className="col-span-2">
              <TextAreaField
                id="description"
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Description détaillée du produit..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingProduct ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
      />
    </Layout>
  );
};

export default Products;
