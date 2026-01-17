import { Response } from 'express';
import { StockMovementModel } from '../models/StockMovement';
import { AuthRequest } from '../middleware/auth';

export const getAllMovements = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, movement_type, start_date, end_date, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;

    const filters = {
      product_id: product_id ? parseInt(product_id as string) : undefined,
      movement_type: movement_type as string,
      start_date: start_date as string,
      end_date: end_date as string,
      page: pageNum,
      limit: limitNum
    };

    const { movements, total } = await StockMovementModel.findAll(filters);

    res.json({
      movements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createMovement = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, movement_type, quantity, reference, reason, notes } = req.body;

    if (!product_id || !movement_type || !quantity) {
      return res.status(400).json({ error: 'Produit, type et quantité sont requis' });
    }

    if (!['in', 'out', 'adjustment', 'return'].includes(movement_type)) {
      return res.status(400).json({ error: 'Type de mouvement invalide' });
    }

    const movement = await StockMovementModel.create({
      product_id,
      movement_type,
      quantity: parseInt(quantity),
      reference,
      reason,
      notes,
      user_id: req.user?.id
    });

    res.status(201).json({ message: 'Mouvement enregistré avec succès', movement });
  } catch (error: any) {
    console.error('Erreur lors de la création du mouvement:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de l\'enregistrement' });
  }
};

export const getMovementsByProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const movements = await StockMovementModel.findByProductId(
      parseInt(id),
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ movements });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements du produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getMovementsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const summary = await StockMovementModel.getSummary({
      start_date: start_date as string,
      end_date: end_date as string
    });

    res.json({ summary });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getStockValue = async (req: AuthRequest, res: Response) => {
  try {
    const value = await StockMovementModel.getStockValue();
    res.json({ value });
  } catch (error) {
    console.error('Erreur lors du calcul de la valeur du stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
