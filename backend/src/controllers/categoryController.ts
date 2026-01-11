import { Response } from 'express';
import { CategoryModel } from '../models/Category';
import { AuthRequest } from '../middleware/auth';

export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await CategoryModel.findAll();
    res.json({ categories });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCategoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(parseInt(id));

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await CategoryModel.create(req.body);
    res.status(201).json({ message: 'Catégorie créée avec succès', category });
  } catch (error: any) {
    console.error('Erreur lors de la création de la catégorie:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.update(parseInt(id), req.body);

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie mise à jour avec succès', category });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CategoryModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
