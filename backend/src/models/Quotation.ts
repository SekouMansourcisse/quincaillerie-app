import pool from '../config/database';

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  description?: string;
}

export interface Quotation {
  id?: number;
  quotation_number: string;
  customer_id?: number;
  user_id?: number;
  total_amount: number;
  discount?: number;
  tax?: number;
  net_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  validity_days?: number;
  valid_until?: string;
  notes?: string;
  terms_conditions?: string;
  quotation_date?: Date;
  converted_to_sale_id?: number;
  created_at?: Date;
  updated_at?: Date;
  items?: QuotationItem[];
  customer_name?: string;
  username?: string;
}

export class QuotationModel {
  // Créer un devis avec ses items
  static async create(quotation: Quotation, items: QuotationItem[]): Promise<Quotation> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculer la date de validité
      const validityDays = quotation.validity_days || 30;
      const quotationDate = quotation.quotation_date || new Date();
      const validUntil = new Date(quotationDate);
      validUntil.setDate(validUntil.getDate() + validityDays);

      // Insérer le devis
      const quotationQuery = `
        INSERT INTO quotations (
          quotation_number, customer_id, user_id, total_amount, discount, tax,
          net_amount, status, validity_days, valid_until, notes, terms_conditions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const quotationValues = [
        quotation.quotation_number,
        quotation.customer_id,
        quotation.user_id,
        quotation.total_amount,
        quotation.discount || 0,
        quotation.tax || 0,
        quotation.net_amount,
        quotation.status || 'draft',
        validityDays,
        validUntil.toISOString(),
        quotation.notes,
        quotation.terms_conditions
      ];
      const quotationResult = await client.query(quotationQuery, quotationValues);
      const newQuotation = quotationResult.rows[0];

      // Insérer les items du devis
      const quotationItems: QuotationItem[] = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, subtotal, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const itemValues = [
          newQuotation.id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.description
        ];
        const itemResult = await client.query(itemQuery, itemValues);
        quotationItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      newQuotation.items = quotationItems;
      return newQuotation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Trouver un devis par ID avec ses items et informations liées
  static async findById(id: number): Promise<Quotation | null> {
    const quotationQuery = `
      SELECT q.*,
             c.name as customer_name,
             u.username
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = $1
    `;
    const quotationResult = await pool.query(quotationQuery, [id]);
    if (quotationResult.rows.length === 0) return null;

    const quotation = quotationResult.rows[0];
    const itemsQuery = 'SELECT * FROM quotation_items WHERE quotation_id = $1';
    const itemsResult = await pool.query(itemsQuery, [id]);
    quotation.items = itemsResult.rows;

    return quotation;
  }

  // Obtenir tous les devis avec filtres et pagination
  static async findAll(filters?: {
    start_date?: Date;
    end_date?: Date;
    customer_id?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ quotations: Quotation[]; total: number }> {
    let baseQuery = `
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.user_id = u.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      baseQuery += ` AND q.quotation_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      baseQuery += ` AND q.quotation_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    if (filters?.customer_id) {
      baseQuery += ` AND q.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters?.status) {
      baseQuery += ` AND q.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `
      SELECT q.*, c.name as customer_name, u.username
      ${baseQuery}
      ORDER BY q.quotation_date DESC
    `;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { quotations: result.rows, total };
  }

  // Générer un numéro de devis unique
  static async generateQuotationNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `DEVIS${year}${month}${day}`;

    const query = `
      SELECT quotation_number FROM quotations
      WHERE quotation_number LIKE $1
      ORDER BY quotation_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [`${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = result.rows[0].quotation_number;
    const lastSequence = parseInt(lastNumber.split('-')[1]);
    const newSequence = String(lastSequence + 1).padStart(3, '0');

    return `${prefix}-${newSequence}`;
  }

  // Mettre à jour un devis
  static async update(id: number, updates: Partial<Quotation>): Promise<Quotation | null> {
    const allowedFields = ['notes', 'terms_conditions', 'validity_days', 'valid_until'];
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE quotations
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    return this.findById(id);
  }

  // Mettre à jour le statut d'un devis
  static async updateStatus(id: number, status: string): Promise<Quotation | null> {
    const query = `
      UPDATE quotations
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    if (result.rows.length === 0) return null;

    return this.findById(id);
  }

  // Convertir un devis en vente
  static async convertToSale(id: number, saleId: number): Promise<Quotation | null> {
    const query = `
      UPDATE quotations
      SET status = 'converted',
          converted_to_sale_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [saleId, id]);
    if (result.rows.length === 0) return null;

    return this.findById(id);
  }

  // Supprimer un devis (seulement si draft)
  static async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM quotations
      WHERE id = $1 AND status = 'draft'
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Marquer les devis expirés
  static async markExpiredQuotations(): Promise<number> {
    const query = `
      UPDATE quotations
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('draft', 'sent')
        AND valid_until < CURRENT_TIMESTAMP
      RETURNING id
    `;
    const result = await pool.query(query);
    return result.rows.length;
  }

  // Statistiques des devis
  static async getStats(filters?: { start_date?: Date; end_date?: Date }): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_quotations,
        SUM(net_amount) as total_value,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count,
        SUM(CASE WHEN status = 'converted' THEN net_amount ELSE 0 END) as converted_value,
        CASE
          WHEN COUNT(*) > 0 THEN
            ROUND(CAST(SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2)
          ELSE 0
        END as conversion_rate
      FROM quotations
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      query += ` AND quotation_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      query += ` AND quotation_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
