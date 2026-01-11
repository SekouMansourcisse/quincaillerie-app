import pool from '../config/database';

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id?: number;
  sale_number: string;
  customer_id?: number;
  user_id?: number;
  total_amount: number;
  discount?: number;
  tax?: number;
  net_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'check';
  payment_status: 'paid' | 'pending' | 'partial';
  notes?: string;
  sale_date?: Date;
  created_at?: Date;
  items?: SaleItem[];
}

export class SaleModel {
  // Créer une vente avec ses items
  static async create(sale: Sale, items: SaleItem[]): Promise<Sale> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insérer la vente
      const saleQuery = `
        INSERT INTO sales (
          sale_number, customer_id, user_id, total_amount, discount, tax,
          net_amount, payment_method, payment_status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const saleValues = [
        sale.sale_number,
        sale.customer_id,
        sale.user_id,
        sale.total_amount,
        sale.discount || 0,
        sale.tax || 0,
        sale.net_amount,
        sale.payment_method,
        sale.payment_status,
        sale.notes
      ];
      const saleResult = await client.query(saleQuery, saleValues);
      const newSale = saleResult.rows[0];

      // Insérer les items de la vente
      const saleItems: SaleItem[] = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const itemValues = [
          newSale.id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.subtotal
        ];
        const itemResult = await client.query(itemQuery, itemValues);
        saleItems.push(itemResult.rows[0]);

        // Mettre à jour le stock et créer un mouvement de stock
        if (item.product_id) {
          const stockQuery = `
            UPDATE products
            SET current_stock = current_stock - $1
            WHERE id = $2
            RETURNING current_stock
          `;
          const stockResult = await client.query(stockQuery, [item.quantity, item.product_id]);

          const movementQuery = `
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, reference, reason,
              user_id, sale_id, new_stock
            )
            VALUES ($1, 'out', $2, $3, 'Vente', $4, $5, $6)
          `;
          await client.query(movementQuery, [
            item.product_id,
            item.quantity,
            newSale.sale_number,
            sale.user_id,
            newSale.id,
            stockResult.rows[0].current_stock
          ]);
        }
      }

      await client.query('COMMIT');
      newSale.items = saleItems;
      return newSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Trouver une vente par ID avec ses items
  static async findById(id: number): Promise<Sale | null> {
    const saleQuery = 'SELECT * FROM sales WHERE id = $1';
    const saleResult = await pool.query(saleQuery, [id]);
    if (saleResult.rows.length === 0) return null;

    const sale = saleResult.rows[0];
    const itemsQuery = 'SELECT * FROM sale_items WHERE sale_id = $1';
    const itemsResult = await pool.query(itemsQuery, [id]);
    sale.items = itemsResult.rows;

    return sale;
  }

  // Obtenir toutes les ventes avec filtres et pagination
  static async findAll(filters?: {
    start_date?: Date;
    end_date?: Date;
    customer_id?: number;
    payment_status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sales: Sale[]; total: number }> {
    let baseQuery = 'FROM sales WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      baseQuery += ` AND sale_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      baseQuery += ` AND sale_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    if (filters?.customer_id) {
      baseQuery += ` AND customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters?.payment_status) {
      baseQuery += ` AND payment_status = $${paramCount}`;
      values.push(filters.payment_status);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `SELECT * ${baseQuery} ORDER BY sale_date DESC`;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { sales: result.rows, total };
  }

  // Générer un numéro de vente unique
  static async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `VEN${year}${month}${day}`;

    const query = `
      SELECT sale_number FROM sales
      WHERE sale_number LIKE $1
      ORDER BY sale_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [`${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = result.rows[0].sale_number;
    const lastSequence = parseInt(lastNumber.split('-')[1]);
    const newSequence = String(lastSequence + 1).padStart(3, '0');

    return `${prefix}-${newSequence}`;
  }

  // Statistiques des ventes
  static async getStats(filters?: { start_date?: Date; end_date?: Date }): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_sales,
        SUM(net_amount) as total_revenue,
        AVG(net_amount) as average_sale,
        SUM(CASE WHEN payment_status = 'paid' THEN net_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'pending' THEN net_amount ELSE 0 END) as pending_amount
      FROM sales
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      query += ` AND sale_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      query += ` AND sale_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
