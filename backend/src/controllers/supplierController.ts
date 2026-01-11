import { Response } from 'express';
import { SupplierModel } from '../models/Supplier';
import { AuthRequest } from '../middleware/auth';

export const getAllSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const { is_active } = req.query;
    const isActive = is_active !== undefined ? is_active === 'true' : undefined;
    const suppliers = await SupplierModel.findAll(isActive);
    res.json({ suppliers });
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getSupplierById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierModel.findById(parseInt(id));

    if (!supplier) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json({ supplier });
  } catch (error) {
    console.error('Erreur lors de la récupération du fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await SupplierModel.create(req.body);
    res.status(201).json({ message: 'Fournisseur créé avec succès', supplier });
  } catch (error) {
    console.error('Erreur lors de la création du fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierModel.update(parseInt(id), req.body);

    if (!supplier) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json({ message: 'Fournisseur mis à jour avec succès', supplier });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await SupplierModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json({ message: 'Fournisseur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du fournisseur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
