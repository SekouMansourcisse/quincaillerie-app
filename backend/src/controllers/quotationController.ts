import { Response } from 'express';
import { QuotationModel } from '../models/Quotation';
import { SaleModel } from '../models/Sale';
import { AuthRequest } from '../middleware/auth';

export const getAllQuotations = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, status, start_date, end_date, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 15;

    const filters = {
      customer_id: customer_id ? parseInt(customer_id as string) : undefined,
      status: status as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      page: pageNum,
      limit: limitNum
    };

    const { quotations, total } = await QuotationModel.findAll(filters);

    res.json({
      quotations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getQuotationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(parseInt(id));

    if (!quotation) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    res.json({ quotation });
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, items, discount, tax, notes, terms_conditions, validity_days } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Le devis doit contenir au moins un article' });
    }

    // Générer le numéro de devis
    const quotationNumber = await QuotationModel.generateQuotationNumber();

    // Calculer les montants
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const netAmount = totalAmount - discountAmount + taxAmount;

    const quotation = await QuotationModel.create(
      {
        quotation_number: quotationNumber,
        customer_id,
        user_id: req.user?.id,
        total_amount: totalAmount,
        discount: discountAmount,
        tax: taxAmount,
        net_amount: netAmount,
        status: 'draft',
        validity_days: validity_days || 30,
        notes,
        terms_conditions
      },
      items
    );

    res.status(201).json({ message: 'Devis créé avec succès', quotation });
  } catch (error: any) {
    console.error('Erreur lors de la création du devis:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const updateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier que le devis existe
    const existingQuotation = await QuotationModel.findById(parseInt(id));
    if (!existingQuotation) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // Seuls les devis en draft peuvent être modifiés
    if (existingQuotation.status !== 'draft') {
      return res.status(400).json({ error: 'Seuls les devis en brouillon peuvent être modifiés' });
    }

    const quotation = await QuotationModel.update(parseInt(id), updates);

    res.json({ message: 'Devis mis à jour avec succès', quotation });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du devis:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const updateQuotationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Le statut est requis' });
    }

    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const quotation = await QuotationModel.updateStatus(parseInt(id), status);

    if (!quotation) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    res.json({ message: 'Statut du devis mis à jour avec succès', quotation });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const convertQuotationToSale = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_method, payment_status } = req.body;

    // Récupérer le devis
    const quotation = await QuotationModel.findById(parseInt(id));
    if (!quotation) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // Vérifier que le devis peut être converti
    if (quotation.status !== 'accepted' && quotation.status !== 'sent') {
      return res.status(400).json({ error: 'Seuls les devis acceptés ou envoyés peuvent être convertis' });
    }

    // Générer le numéro de vente
    const saleNumber = await SaleModel.generateSaleNumber();

    // Créer la vente à partir du devis
    const sale = await SaleModel.create(
      {
        sale_number: saleNumber,
        customer_id: quotation.customer_id,
        user_id: req.user?.id,
        total_amount: quotation.total_amount,
        discount: quotation.discount,
        tax: quotation.tax,
        net_amount: quotation.net_amount,
        payment_method: payment_method || 'cash',
        payment_status: payment_status || 'paid',
        notes: `Converti du devis ${quotation.quotation_number}`
      },
      quotation.items?.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      })) || []
    );

    // Mettre à jour le devis
    await QuotationModel.convertToSale(parseInt(id), sale.id!);

    res.json({ message: 'Devis converti en vente avec succès', sale });
  } catch (error: any) {
    console.error('Erreur lors de la conversion du devis:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const deleteQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await QuotationModel.delete(parseInt(id));

    if (!deleted) {
      return res.status(400).json({ error: 'Le devis ne peut pas être supprimé (doit être en brouillon)' });
    }

    res.json({ message: 'Devis supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du devis:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

export const getQuotationStats = async (req: AuthRequest, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const filters = {
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined
    };

    const stats = await QuotationModel.getStats(filters);

    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markExpiredQuotations = async (req: AuthRequest, res: Response) => {
  try {
    const count = await QuotationModel.markExpiredQuotations();

    res.json({ message: `${count} devis marqués comme expirés`, count });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des devis expirés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
