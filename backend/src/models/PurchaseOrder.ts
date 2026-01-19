import pool from '../config/database';

export interface PurchaseOrderItem {
  id?: number;
  po_id?: number;
  product_id?: number;
  product_name: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  id?: number;
  po_number: string;
  supplier_id?: number;
  user_id?: number;
  total_amount: number;
  discount?: number;
  tax?: number;
  net_amount: number;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  payment_terms?: string;
  po_date?: Date;
  created_at?: Date;
  updated_at?: Date;
  items?: PurchaseOrderItem[];
  supplier_name?: string;
  username?: string;
}

export class PurchaseOrderModel {
  // Créer une commande fournisseur avec ses items
  static async create(po: PurchaseOrder, items: PurchaseOrderItem[]): Promise<PurchaseOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insérer la commande
      const poQuery = `
        INSERT INTO purchase_orders (
          po_number, supplier_id, user_id, total_amount, discount, tax,
          net_amount, status, expected_delivery_date, notes, payment_terms
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const poValues = [
        po.po_number,
        po.supplier_id,
        po.user_id,
        po.total_amount,
        po.discount || 0,
        po.tax || 0,
        po.net_amount,
        po.status || 'draft',
        po.expected_delivery_date,
        po.notes,
        po.payment_terms
      ];
      const poResult = await client.query(poQuery, poValues);
      const newPO = poResult.rows[0];

      // Insérer les items de la commande
      const poItems: PurchaseOrderItem[] = [];
      for (const item of items) {
        const itemQuery = `
          INSERT INTO purchase_order_items (po_id, product_id, product_name, quantity_ordered, unit_price, subtotal, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const itemValues = [
          newPO.id,
          item.product_id,
          item.product_name,
          item.quantity_ordered,
          item.unit_price,
          item.subtotal,
          item.notes
        ];
        const itemResult = await client.query(itemQuery, itemValues);
        poItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      newPO.items = poItems;
      return newPO;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Trouver une commande par ID avec ses items et informations liées
  static async findById(id: number): Promise<PurchaseOrder | null> {
    const poQuery = `
      SELECT po.*,
             s.name as supplier_name,
             u.username
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE po.id = $1
    `;
    const poResult = await pool.query(poQuery, [id]);
    if (poResult.rows.length === 0) return null;

    const po = poResult.rows[0];
    const itemsQuery = 'SELECT * FROM purchase_order_items WHERE po_id = $1';
    const itemsResult = await pool.query(itemsQuery, [id]);
    po.items = itemsResult.rows;

    return po;
  }

  // Obtenir toutes les commandes avec filtres et pagination
  static async findAll(filters?: {
    start_date?: Date;
    end_date?: Date;
    supplier_id?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
    let baseQuery = `
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      baseQuery += ` AND po.po_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      baseQuery += ` AND po.po_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    if (filters?.supplier_id) {
      baseQuery += ` AND po.supplier_id = $${paramCount}`;
      values.push(filters.supplier_id);
      paramCount++;
    }

    if (filters?.status) {
      baseQuery += ` AND po.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `
      SELECT po.*, s.name as supplier_name, u.username
      ${baseQuery}
      ORDER BY po.po_date DESC
    `;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { purchaseOrders: result.rows, total };
  }

  // Générer un numéro de commande unique
  static async generatePONumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const prefix = `PO${year}${month}${day}`;

    const query = `
      SELECT po_number FROM purchase_orders
      WHERE po_number LIKE $1
      ORDER BY po_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [`${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}-001`;
    }

    const lastNumber = result.rows[0].po_number;
    const lastSequence = parseInt(lastNumber.split('-')[1]);
    const newSequence = String(lastSequence + 1).padStart(3, '0');

    return `${prefix}-${newSequence}`;
  }

  // Mettre à jour une commande
  static async update(id: number, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
    const allowedFields = ['notes', 'payment_terms', 'expected_delivery_date'];
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
      UPDATE purchase_orders
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    return this.findById(id);
  }

  // CRITIQUE: Réceptionner les marchandises avec mise à jour du stock
  static async receiveGoods(
    poId: number,
    items: { item_id: number; quantity_received: number }[]
  ): Promise<PurchaseOrder> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Récupérer la commande
      const poQuery = 'SELECT * FROM purchase_orders WHERE id = $1';
      const poResult = await client.query(poQuery, [poId]);
      if (poResult.rows.length === 0) {
        throw new Error('Commande non trouvée');
      }
      const po = poResult.rows[0];

      // Récupérer tous les items de la commande
      const itemsQuery = 'SELECT * FROM purchase_order_items WHERE po_id = $1';
      const itemsResult = await client.query(itemsQuery, [poId]);
      const allItems = itemsResult.rows;

      // Traiter chaque item reçu
      for (const receivedItem of items) {
        const item = allItems.find((i: any) => i.id === receivedItem.item_id);
        if (!item) {
          throw new Error(`Item ${receivedItem.item_id} non trouvé`);
        }

        // Vérifier la quantité
        const newTotalReceived = (item.quantity_received || 0) + receivedItem.quantity_received;
        if (newTotalReceived > item.quantity_ordered) {
          throw new Error(
            `Quantité reçue trop élevée pour ${item.product_name}: ${newTotalReceived} > ${item.quantity_ordered}`
          );
        }

        // Mettre à jour la quantité reçue
        const updateItemQuery = `
          UPDATE purchase_order_items
          SET quantity_received = quantity_received + $1
          WHERE id = $2
        `;
        await client.query(updateItemQuery, [receivedItem.quantity_received, receivedItem.item_id]);

        // Mettre à jour le stock du produit
        if (item.product_id) {
          const updateStockQuery = `
            UPDATE products
            SET current_stock = current_stock + $1
            WHERE id = $2
          `;
          await client.query(updateStockQuery, [receivedItem.quantity_received, item.product_id]);

          // Récupérer le nouveau stock
          const getStockQuery = `SELECT current_stock FROM products WHERE id = $1`;
          const stockResult = await client.query(getStockQuery, [item.product_id]);
          const newStock = stockResult.rows[0]?.current_stock || 0;

          // Créer le mouvement de stock
          const movementQuery = `
            INSERT INTO stock_movements (
              product_id, movement_type, quantity, reference, reason, user_id, new_stock
            )
            VALUES ($1, 'in', $2, $3, 'Réception commande fournisseur', $4, $5)
          `;
          await client.query(movementQuery, [
            item.product_id,
            receivedItem.quantity_received,
            po.po_number,
            po.user_id,
            newStock
          ]);
        }
      }

      // Mettre à jour le statut de la commande
      const updatedItemsQuery = 'SELECT * FROM purchase_order_items WHERE po_id = $1';
      const updatedItemsResult = await client.query(updatedItemsQuery, [poId]);
      const allUpdatedItems = updatedItemsResult.rows;

      const allReceived = allUpdatedItems.every(
        (item: any) => item.quantity_received === item.quantity_ordered
      );
      const partialReceived = allUpdatedItems.some((item: any) => item.quantity_received > 0);

      let newStatus = po.status;
      if (allReceived) {
        newStatus = 'received';
      } else if (partialReceived) {
        newStatus = 'partial';
      }

      const updatePOQuery = `
        UPDATE purchase_orders
        SET status = $1,
            actual_delivery_date = CASE WHEN $1 = 'received' THEN CURRENT_TIMESTAMP ELSE actual_delivery_date END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await client.query(updatePOQuery, [newStatus, poId]);

      await client.query('COMMIT');

      // Retourner la commande mise à jour
      const updatedPO = await this.findById(poId);
      if (!updatedPO) {
        throw new Error('Erreur lors de la récupération de la commande mise à jour');
      }
      return updatedPO;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Supprimer une commande (seulement si draft)
  static async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM purchase_orders
      WHERE id = $1 AND status = 'draft'
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Statistiques des commandes
  static async getStats(filters?: { start_date?: Date; end_date?: Date }): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_orders,
        SUM(net_amount) as total_value,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status IN ('sent', 'partial') THEN net_amount ELSE 0 END) as pending_value
      FROM purchase_orders
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.start_date) {
      query += ` AND po_date >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters?.end_date) {
      query += ` AND po_date <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
