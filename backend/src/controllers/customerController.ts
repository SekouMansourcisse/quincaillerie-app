import { Response } from 'express';
import { CustomerModel } from '../models/Customer';
import { AuthRequest } from '../middleware/auth';

export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { is_active } = req.query;
    const isActive = is_active !== undefined ? is_active === 'true' : undefined;
    const customers = await CustomerModel.findAll(isActive);
    res.json({ customers });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(parseInt(id));

    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await CustomerModel.create(req.body);
    res.status(201).json({ message: 'Client créé avec succès', customer });
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.update(parseInt(id), req.body);

    if (!customer) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ message: 'Client mis à jour avec succès', customer });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await CustomerModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
