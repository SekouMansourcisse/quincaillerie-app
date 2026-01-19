import { Response } from 'express';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { AuthRequest } from '../middleware/auth';

export const getAllPurchaseOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, status, start_date, end_date, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 15;

    const filters = {
      supplier_id: supplier_id ? parseInt(supplier_id as string) : undefined,
      status: status as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      page: pageNum,
      limit: limitNum
    };

    const { purchaseOrders, total } = await PurchaseOrderModel.findAll(filters);

    res.json({
      purchase_orders: purchaseOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPurchaseOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrderModel.findById(parseInt(id));

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ purchase_order: purchaseOrder });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, items, discount, tax, expected_delivery_date, notes, payment_terms } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
    }

    // Générer le numéro de commande
    const poNumber = await PurchaseOrderModel.generatePONumber();

    // Calculer les montants
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const netAmount = totalAmount - discountAmount + taxAmount;

    const purchaseOrder = await PurchaseOrderModel.create(
      {
        po_number: poNumber,
        supplier_id,
        user_id: req.user?.id,
        total_amount: totalAmount,
        discount: discountAmount,
        tax: taxAmount,
        net_amount: netAmount,
        status: 'draft',
        expected_delivery_date,
        notes,
        payment_terms
      },
      items
    );

    res.status(201).json({ message: 'Commande créée avec succès', purchase_order: purchaseOrder });
  } catch (error: any) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que la commande existe
    const existingPO = await PurchaseOrderModel.findById(parseInt(id));
    if (!existingPO) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Seules les commandes en draft peuvent être modifiées
    if (existingPO.status !== 'draft') {
      return res.status(400).json({ error: 'Seules les commandes en brouillon peuvent être modifiées' });
    }

    const purchaseOrder = await PurchaseOrderModel.update(parseInt(id), updates);

    res.json({ message: 'Commande mise à jour avec succès', purchase_order: purchaseOrder });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const receiveGoods = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Veuillez spécifier les articles à réceptionner' });
    }

    // Valider les quantités
    for (const item of items) {
      if (!item.item_id || !item.quantity_received || item.quantity_received <= 0) {
        return res.status(400).json({ error: 'Quantités invalides' });
      }
    }

    const purchaseOrder = await PurchaseOrderModel.receiveGoods(parseInt(id), items);

    res.json({
      message: 'Marchandises réceptionnées avec succès. Stock mis à jour.',
      purchase_order: purchaseOrder
    });
  } catch (error: any) {
    console.error('Erreur lors de la réception des marchandises:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await PurchaseOrderModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(400).json({ error: 'La commande ne peut pas être supprimée (doit être en brouillon)' });
    }

    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la commande:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const getPurchaseOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const filters = {
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined
    };

    const stats = await PurchaseOrderModel.getStats(filters);

    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
