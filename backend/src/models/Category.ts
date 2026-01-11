import pool from '../config/database';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class CategoryModel {
  static async create(category: Category): Promise<Category> {
    const query = 'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [category.name, category.description]);
    return result.rows[0];
  }

  static async findAll(): Promise<Category[]> {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, category: Partial<Category>): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (category.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(category.name);
    }
    if (category.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(category.description);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
