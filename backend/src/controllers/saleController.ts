import { Response } from 'express';
import { SaleModel } from '../models/Sale';
import { AuthRequest } from '../middleware/auth';

export const getAllSales = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date, customer_id, payment_status, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 10;

    const filters = {
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      customer_id: customer_id ? parseInt(customer_id as string) : undefined,
      payment_status: payment_status as string,
      page: pageNum,
      limit: limitNum
    };

    const { sales, total } = await SaleModel.findAll(filters);

    res.json({
      sales,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getSaleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await SaleModel.findById(parseInt(id));

    if (!sale) {
      return res.status(404).json({ error: 'Vente non trouvée' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const { items, ...saleData } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La vente doit contenir au moins un article' });
    }

    // Générer le numéro de vente
    const saleNumber = await SaleModel.generateSaleNumber();

    // Ajouter l'ID de l'utilisateur
    saleData.user_id = req.user?.id;
    saleData.sale_number = saleNumber;

    const sale = await SaleModel.create(saleData, items);
    res.status(201).json({ message: 'Vente créée avec succès', sale });
  } catch (error: any) {
    console.error('Erreur lors de la création de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

export const getSalesStats = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const filters = {
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined
    };

    const stats = await SaleModel.getStats(filters);
    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCashReport = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    // Si pas de date fournie, utiliser la date du jour
    const reportDate = date
      ? String(date)
      : new Date().toISOString().split('T')[0];

    const report = await SaleModel.getCashReport(reportDate);
    res.json(report);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de caisse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;

    const stats = await SaleModel.getDashboardStats(daysNum);
    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
