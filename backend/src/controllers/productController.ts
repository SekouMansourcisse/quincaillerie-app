import { Response } from 'express';
import { ProductModel } from '../models/Product';
import { AuthRequest } from '../middleware/auth';

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category_id, supplier_id, low_stock, is_active, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const filters = {
      search: search as string,
      category_id: category_id ? parseInt(category_id as string) : undefined,
      supplier_id: supplier_id ? parseInt(supplier_id as string) : undefined,
      low_stock: low_stock === 'true',
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      page: pageNum,
      limit: limitNum
    };

    const { products, total } = await ProductModel.findAll(filters);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(parseInt(id));

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await ProductModel.create(req.body);
    res.status(201).json({ message: 'Produit créé avec succès', product });
  } catch (error: any) {
    console.error('Erreur lors de la création du produit:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cette référence ou ce code-barres existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.update(parseInt(id), req.body);

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit mis à jour avec succès', product });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cette référence ou ce code-barres existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await ProductModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await ProductModel.getLowStockProducts();
    res.json({ products });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits en stock faible:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
