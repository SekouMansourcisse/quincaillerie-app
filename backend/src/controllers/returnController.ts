import { Response } from 'express';
import { ReturnModel } from '../models/Return';
import { SaleModel } from '../models/Sale';
import { AuthRequest } from '../middleware/auth';

export const getAllReturns = async (req: AuthRequest, res: Response) => {
  try {
    const { sale_id, customer_id, status, start_date, end_date, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 15;

    const filters = {
      sale_id: sale_id ? parseInt(sale_id as string) : undefined,
      customer_id: customer_id ? parseInt(customer_id as string) : undefined,
      status: status as string,
      start_date: start_date as string,
      end_date: end_date as string,
      page: pageNum,
      limit: limitNum
    };

    const { returns, total } = await ReturnModel.findAll(filters);

    res.json({
      returns,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des retours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getReturnById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const returnData = await ReturnModel.findById(parseInt(id));

    if (!returnData) {
      return res.status(404).json({ error: 'Retour non trouvé' });
    }

    res.json({ return: returnData });
  } catch (error) {
    console.error('Erreur lors de la récupération du retour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { sale_id, items, refund_method, reason, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Le retour doit contenir au moins un article' });
    }

    // Récupérer la vente d'origine si spécifiée
    let customerId = null;
    if (sale_id) {
      const sale = await SaleModel.findById(sale_id);
      if (!sale) {
        return res.status(404).json({ error: 'Vente d\'origine non trouvée' });
      }
      customerId = sale.customer_id;
    }

    // Générer le numéro de retour
    const returnNumber = await ReturnModel.generateReturnNumber();

    // Calculer le montant total
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    const returnData = await ReturnModel.create(
      {
        return_number: returnNumber,
        sale_id,
        customer_id: customerId,
        user_id: req.user?.id,
        total_amount: totalAmount,
        refund_method: refund_method || 'cash',
        status: 'completed',
        reason,
        notes
      },
      items
    );

    res.status(201).json({ message: 'Retour enregistré avec succès', return: returnData });
  } catch (error: any) {
    console.error('Erreur lors de la création du retour:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const cancelReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const returnData = await ReturnModel.cancel(parseInt(id));

    if (!returnData) {
      return res.status(404).json({ error: 'Retour non trouvé ou déjà annulé' });
    }

    res.json({ message: 'Retour annulé avec succès', return: returnData });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du retour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getReturnStats = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await ReturnModel.getStats({
      start_date: start_date as string,
      end_date: end_date as string
    });

    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les items d'une vente pour créer un retour
export const getSaleItemsForReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { saleId } = req.params;
    const sale = await SaleModel.findById(parseInt(saleId));

    if (!sale) {
      return res.status(404).json({ error: 'Vente non trouvée' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
