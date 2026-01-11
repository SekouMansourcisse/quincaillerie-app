import pool from '../config/database';

export interface Product {
  id?: number;
  name: string;
  description?: string;
  reference?: string;
  barcode?: string;
  category_id?: number;
  supplier_id?: number;
  purchase_price: number;
  selling_price: number;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  unit?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  category_name?: string;
  supplier_name?: string;
}

export class ProductModel {
  // Créer un nouveau produit
  static async create(product: Product): Promise<Product> {
    const query = `
      INSERT INTO products (
        name, description, reference, barcode, category_id, supplier_id,
        purchase_price, selling_price, current_stock, min_stock, max_stock, unit, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      product.name,
      product.description,
      product.reference,
      product.barcode,
      product.category_id,
      product.supplier_id,
      product.purchase_price,
      product.selling_price,
      product.current_stock || 0,
      product.min_stock || 0,
      product.max_stock,
      product.unit || 'piece',
      product.image_url
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver un produit par ID
  static async findById(id: number): Promise<Product | null> {
    const query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Obtenir tous les produits avec filtres et pagination
  static async findAll(filters?: {
    search?: string;
    category_id?: number;
    supplier_id?: number;
    low_stock?: boolean;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.search) {
      baseQuery += ` AND (p.name ILIKE $${paramCount} OR p.reference ILIKE $${paramCount} OR p.barcode ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters?.category_id) {
      baseQuery += ` AND p.category_id = $${paramCount}`;
      values.push(filters.category_id);
      paramCount++;
    }

    if (filters?.supplier_id) {
      baseQuery += ` AND p.supplier_id = $${paramCount}`;
      values.push(filters.supplier_id);
      paramCount++;
    }

    if (filters?.low_stock) {
      baseQuery += ` AND p.current_stock <= p.min_stock`;
    }

    if (filters?.is_active !== undefined) {
      baseQuery += ` AND p.is_active = $${paramCount}`;
      values.push(filters.is_active);
      paramCount++;
    }

    // Query pour le total
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query pour les données
    let dataQuery = `SELECT p.*, c.name as category_name, s.name as supplier_name ${baseQuery} ORDER BY p.name ASC`;

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      dataQuery += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      values.push(filters.limit, offset);
    }

    const result = await pool.query(dataQuery, values);
    return { products: result.rows, total };
  }

  // Mettre à jour un produit
  static async update(id: number, product: Partial<Product>): Promise<Product | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (product.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(product.name);
    }
    if (product.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(product.description);
    }
    if (product.reference !== undefined) {
      fields.push(`reference = $${paramCount++}`);
      values.push(product.reference);
    }
    if (product.barcode !== undefined) {
      fields.push(`barcode = $${paramCount++}`);
      values.push(product.barcode);
    }
    if (product.category_id !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(product.category_id);
    }
    if (product.supplier_id !== undefined) {
      fields.push(`supplier_id = $${paramCount++}`);
      values.push(product.supplier_id);
    }
    if (product.purchase_price !== undefined) {
      fields.push(`purchase_price = $${paramCount++}`);
      values.push(product.purchase_price);
    }
    if (product.selling_price !== undefined) {
      fields.push(`selling_price = $${paramCount++}`);
      values.push(product.selling_price);
    }
    if (product.current_stock !== undefined) {
      fields.push(`current_stock = $${paramCount++}`);
      values.push(product.current_stock);
    }
    if (product.min_stock !== undefined) {
      fields.push(`min_stock = $${paramCount++}`);
      values.push(product.min_stock);
    }
    if (product.max_stock !== undefined) {
      fields.push(`max_stock = $${paramCount++}`);
      values.push(product.max_stock);
    }
    if (product.unit) {
      fields.push(`unit = $${paramCount++}`);
      values.push(product.unit);
    }
    if (product.image_url !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(product.image_url);
    }
    if (product.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(product.is_active);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Supprimer un produit
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Obtenir les produits en stock faible
  static async getLowStockProducts(): Promise<Product[]> {
    const query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= p.min_stock AND p.is_active = true
      ORDER BY p.current_stock ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Mettre à jour le stock
  static async updateStock(id: number, quantity: number): Promise<Product | null> {
    const query = `
      UPDATE products
      SET current_stock = current_stock + $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [quantity, id]);
    return result.rows[0] || null;
  }
}
