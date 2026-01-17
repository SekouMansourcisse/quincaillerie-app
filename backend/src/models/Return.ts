import pool from '../config/database';

export interface ReturnItem {
  id?: number;
  return_id?: number;
  sale_item_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reason?: string;
}

export interface Return {
  id?: number;
  return_number: string;
  sale_id?: number;
  customer_id?: number;
  user_id?: number;
  total_amount: number;
  refund_method: 'cash' | 'credit' | 'exchange';
  status: 'pending' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  return_date?: string;
  created_at?: string;
  items?: ReturnItem[];
  // Joined fields
  sale_number?: string;
  customer_name?: string;
  username?: string;
}

export class ReturnModel {
  // Créer un retour avec ses items
  static async create(returnData: Return, items: ReturnItem[]): Promise<Return> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insérer le retour
      const returnQuery = `
        INSERT INTO returns (
          return_number, sale_id, customer_id, user_id, total_amount,
          refund_method, status, reason, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const returnValues = [
        returnData.return_number,
        returnData.sale_id,
        returnData.customer_id,
        returnData.user_id,
        returnData.total_amount,
        returnData.refund_method || 'cash',
        returnData.status || 'completed',
        returnData.reason,
        returnData.notes
      ];
      const returnResult = await client.query(returnQuery, returnValues);
      const newReturn = returnResult.rows[0];

      // Insérer les items et mettre à jour le stock
      const returnItems: ReturnItem[] = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO return_items (return_id, sale_item_id, product_id, product_name, quantity, unit_price, subtotal, reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const itemValues = [
          newReturn.id,
          item.sale_item_id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.reason
        ];
        const itemResult = await client.query(itemQuery, itemValues);
        returnItems.push(itemResult.rows[0]);

        // Mettre à jour le stock (ajouter les produits retournés)
        if (item.product_id && returnData.status === 'completed') {
          const stockQuery = `
            UPDATE products
            SET current_stock = current_stock + $1
            WHERE id = $2
            RETURNING current_stock
          `;
          const stockResult = await client.query(stockQuery, [item.quantity, item.product_id]);

          // Créer un mouvement de stock
          const movementQuery = `
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, reference, reason,
              user_id, new_stock
            )
            VALUES ($1, 'return', $2, $3, $4, $5, $6)
          `;
          await client.query(movementQuery, [
            item.product_id,
            item.quantity,
            newReturn.return_number,
            item.reason || 'Retour client',
            returnData.user_id,
            stockResult.rows[0].current_stock
          ]);
        }
      }

      await client.query('COMMIT');
      newReturn.items = returnItems;
      return newReturn;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Trouver un retour par ID avec ses items
  static async findById(id: number): Promise<Return | null> {
    const returnQuery = `
      SELECT r.*, s.sale_number, c.name as customer_name, u.username
      FROM returns r
      LEFT JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `;
    const returnResult = await pool.query(returnQuery, [id]);
    if (returnResult.rows.length === 0) return null;

    const returnData = returnResult.rows[0];
    const itemsQuery = 'SELECT * FROM return_items WHERE return_id = $1';
    const itemsResult = await pool.query(itemsQuery, [id]);
    returnData.items = itemsResult.rows;

    return returnData;
  }

  // Obtenir tous les retours avec filtres et pagination
  static async findAll(filters?: {
    sale_id?: number;
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ returns: Return[]; total: number }> {
    let baseQuery = `
      FROM returns r
      LEFT JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.sale_id) {
      baseQuery += ` AND r.sale_id = $${paramCount}`;
      values.push(filters.sale_id);
      paramCount++;
    }

    if (filters?.customer_id) {
      baseQuery += ` AND r.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters?.status) {
      baseQuery += ` AND r.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters?.start_date) {
      baseQuery += ` AND DATE(r.return_date) >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      baseQuery += ` AND DATE(r.return_date) <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `
      SELECT r.*, s.sale_number, c.name as customer_name, u.username
      ${baseQuery}
      ORDER BY r.return_date DESC
    `;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { returns: result.rows, total };
  }

  // Générer un numéro de retour unique
  static async generateReturnNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `AV${year}${month}${day}`;

    const query = `
      SELECT return_number FROM returns
      WHERE return_number LIKE $1
      ORDER BY return_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [`${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = result.rows[0].return_number;
    const lastSequence = parseInt(lastNumber.split('-')[1]);
    const newSequence = String(lastSequence + 1).padStart(3, '0');

    return `${prefix}-${newSequence}`;
  }

  // Obtenir les statistiques des retours
  static async getStats(filters?: { start_date?: string; end_date?: string }): Promise<any> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      whereClause += ` AND DATE(return_date) >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      whereClause += ` AND DATE(return_date) <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    const query = `
      SELECT
        COUNT(*) as total_returns,
        COALESCE(SUM(total_amount), 0) as total_refunded,
        COALESCE(AVG(total_amount), 0) as average_return
      FROM returns
      ${whereClause}
      AND status = 'completed'
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Annuler un retour
  static async cancel(id: number): Promise<Return | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Récupérer le retour et ses items
      const returnData = await this.findById(id);
      if (!returnData || returnData.status === 'cancelled') {
        return null;
      }

      // Annuler les mouvements de stock
      if (returnData.items) {
        for (const item of returnData.items) {
          if (item.product_id) {
            const stockQuery = `
              UPDATE products
              SET current_stock = current_stock - $1
              WHERE id = $2
            `;
            await client.query(stockQuery, [item.quantity, item.product_id]);
          }
        }
      }

      // Mettre à jour le statut
      const updateQuery = `
        UPDATE returns
        SET status = 'cancelled'
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateQuery, [id]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
