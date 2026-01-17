import pool from '../config/database';

export interface StockMovement {
  id?: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  reference?: string;
  reason?: string;
  notes?: string;
  user_id?: number;
  sale_id?: number;
  previous_stock?: number;
  new_stock?: number;
  movement_date?: string;
  created_at?: string;
  // Joined fields
  product_name?: string;
  username?: string;
}

export class StockMovementModel {
  // Créer un mouvement de stock
  static async create(movement: StockMovement): Promise<StockMovement> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Récupérer le stock actuel du produit
      const productQuery = 'SELECT current_stock FROM products WHERE id = $1';
      const productResult = await client.query(productQuery, [movement.product_id]);

      if (productResult.rows.length === 0) {
        throw new Error('Produit non trouvé');
      }

      const previousStock = productResult.rows[0].current_stock || 0;
      let quantityChange = movement.quantity;

      // Calculer le changement de stock selon le type
      if (movement.movement_type === 'out') {
        quantityChange = -Math.abs(movement.quantity);
      } else if (movement.movement_type === 'in' || movement.movement_type === 'return') {
        quantityChange = Math.abs(movement.quantity);
      } else if (movement.movement_type === 'adjustment') {
        // Pour un ajustement, la quantité peut être positive ou négative
        quantityChange = movement.quantity;
      }

      const newStock = previousStock + quantityChange;

      // Vérifier que le stock ne devient pas négatif
      if (newStock < 0) {
        throw new Error('Stock insuffisant pour cette opération');
      }

      // Insérer le mouvement
      const movementQuery = `
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, reference, reason, notes,
          user_id, sale_id, previous_stock, new_stock
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const movementValues = [
        movement.product_id,
        movement.movement_type,
        Math.abs(movement.quantity),
        movement.reference,
        movement.reason,
        movement.notes,
        movement.user_id,
        movement.sale_id,
        previousStock,
        newStock
      ];
      const movementResult = await client.query(movementQuery, movementValues);

      // Mettre à jour le stock du produit
      const updateStockQuery = 'UPDATE products SET current_stock = $1 WHERE id = $2';
      await client.query(updateStockQuery, [newStock, movement.product_id]);

      await client.query('COMMIT');
      return movementResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtenir tous les mouvements avec filtres
  static async findAll(filters?: {
    product_id?: number;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ movements: StockMovement[]; total: number }> {
    let baseQuery = `
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.product_id) {
      baseQuery += ` AND sm.product_id = $${paramCount}`;
      values.push(filters.product_id);
      paramCount++;
    }

    if (filters?.movement_type) {
      baseQuery += ` AND sm.movement_type = $${paramCount}`;
      values.push(filters.movement_type);
      paramCount++;
    }

    if (filters?.start_date) {
      baseQuery += ` AND DATE(sm.movement_date) >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      baseQuery += ` AND DATE(sm.movement_date) <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `
      SELECT sm.*, p.name as product_name, u.username
      ${baseQuery}
      ORDER BY sm.movement_date DESC
    `;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { movements: result.rows, total };
  }

  // Obtenir les mouvements d'un produit spécifique
  static async findByProductId(productId: number, limit?: number): Promise<StockMovement[]> {
    let query = `
      SELECT sm.*, p.name as product_name, u.username
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = $1
      ORDER BY sm.movement_date DESC
    `;
    const values: any[] = [productId];

    if (limit) {
      query += ' LIMIT $2';
      values.push(limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Obtenir le résumé des mouvements par type
  static async getSummary(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      whereClause += ` AND DATE(movement_date) >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      whereClause += ` AND DATE(movement_date) <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    const query = `
      SELECT
        movement_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM stock_movements
      ${whereClause}
      GROUP BY movement_type
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Obtenir la valeur totale du stock
  static async getStockValue(): Promise<{ total_purchase_value: number; total_selling_value: number; total_items: number }> {
    const query = `
      SELECT
        COALESCE(SUM(current_stock * purchase_price), 0) as total_purchase_value,
        COALESCE(SUM(current_stock * selling_price), 0) as total_selling_value,
        COALESCE(SUM(current_stock), 0) as total_items
      FROM products
      WHERE is_active = 1
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}
