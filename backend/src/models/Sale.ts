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

  // Rapport de caisse journalier
  static async getCashReport(date: string): Promise<any> {
    // Statistiques globales du jour
    const statsQuery = `
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_amount), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(AVG(net_amount), 0) as average_sale
      FROM sales
      WHERE DATE(sale_date) = $1
    `;
    const statsResult = await pool.query(statsQuery, [date]);

    // Répartition par mode de paiement
    const paymentQuery = `
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total
      FROM sales
      WHERE DATE(sale_date) = $1
      GROUP BY payment_method
      ORDER BY total DESC
    `;
    const paymentResult = await pool.query(paymentQuery, [date]);

    // Répartition par statut de paiement
    const statusQuery = `
      SELECT
        payment_status,
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total
      FROM sales
      WHERE DATE(sale_date) = $1
      GROUP BY payment_status
    `;
    const statusResult = await pool.query(statusQuery, [date]);

    // Top 5 produits vendus du jour
    const topProductsQuery = `
      SELECT
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.sale_date) = $1
      GROUP BY si.product_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `;
    const topProductsResult = await pool.query(topProductsQuery, [date]);

    // Ventes par heure
    const hourlyQuery = `
      SELECT
        CAST(strftime('%H', sale_date) AS INTEGER) as hour,
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total
      FROM sales
      WHERE DATE(sale_date) = $1
      GROUP BY hour
      ORDER BY hour
    `;
    const hourlyResult = await pool.query(hourlyQuery, [date]);

    // Liste des ventes du jour
    const salesQuery = `
      SELECT s.*, u.username as cashier_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE DATE(s.sale_date) = $1
      ORDER BY s.sale_date DESC
    `;
    const salesResult = await pool.query(salesQuery, [date]);

    return {
      date,
      summary: statsResult.rows[0],
      byPaymentMethod: paymentResult.rows,
      byPaymentStatus: statusResult.rows,
      topProducts: topProductsResult.rows,
      hourlyBreakdown: hourlyResult.rows,
      sales: salesResult.rows
    };
  }

  // Statistiques avancées pour le tableau de bord
  static async getDashboardStats(days: number = 30): Promise<any> {
    // Ventes par jour sur les X derniers jours
    const salesByDayQuery = `
      SELECT
        DATE(sale_date) as date,
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total
      FROM sales
      WHERE sale_date >= date('now', '-${days} days')
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `;
    const salesByDayResult = await pool.query(salesByDayQuery);

    // Ventes par mode de paiement
    const paymentMethodQuery = `
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(net_amount), 0) as total
      FROM sales
      WHERE sale_date >= date('now', '-${days} days')
      GROUP BY payment_method
    `;
    const paymentMethodResult = await pool.query(paymentMethodQuery);

    // Top 10 produits vendus
    const topProductsQuery = `
      SELECT
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date >= date('now', '-${days} days')
      GROUP BY si.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const topProductsResult = await pool.query(topProductsQuery);

    // Ventes par catégorie
    const categoryQuery = `
      SELECT
        COALESCE(c.name, 'Sans catégorie') as category_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE s.sale_date >= date('now', '-${days} days')
      GROUP BY c.name
      ORDER BY total_revenue DESC
    `;
    const categoryResult = await pool.query(categoryQuery);

    // Comparaison avec période précédente
    const currentPeriodQuery = `
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(net_amount), 0) as total_revenue
      FROM sales
      WHERE sale_date >= date('now', '-${days} days')
    `;
    const currentResult = await pool.query(currentPeriodQuery);

    const previousPeriodQuery = `
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(net_amount), 0) as total_revenue
      FROM sales
      WHERE sale_date >= date('now', '-${days * 2} days')
        AND sale_date < date('now', '-${days} days')
    `;
    const previousResult = await pool.query(previousPeriodQuery);

    // Calcul des tendances
    const current = currentResult.rows[0];
    const previous = previousResult.rows[0];

    const salesTrend = previous.total_sales > 0
      ? ((current.total_sales - previous.total_sales) / previous.total_sales) * 100
      : 0;

    const revenueTrend = previous.total_revenue > 0
      ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100
      : 0;

    return {
      salesByDay: salesByDayResult.rows,
      byPaymentMethod: paymentMethodResult.rows,
      topProducts: topProductsResult.rows,
      byCategory: categoryResult.rows,
      trends: {
        currentPeriod: current,
        previousPeriod: previous,
        salesTrend: Math.round(salesTrend * 10) / 10,
        revenueTrend: Math.round(revenueTrend * 10) / 10
      }
    };
  }
}
