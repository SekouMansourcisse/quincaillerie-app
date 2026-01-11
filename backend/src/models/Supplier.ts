import pool from '../config/database';

export interface Supplier {
  id?: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class SupplierModel {
  static async create(supplier: Supplier): Promise<Supplier> {
    const query = `
      INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      supplier.name,
      supplier.contact_person,
      supplier.email,
      supplier.phone,
      supplier.address,
      supplier.city,
      supplier.country,
      supplier.notes
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(isActive?: boolean): Promise<Supplier[]> {
    let query = 'SELECT * FROM suppliers';
    const values: any[] = [];

    if (isActive !== undefined) {
      query += ' WHERE is_active = $1';
      values.push(isActive);
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id: number): Promise<Supplier | null> {
    const query = 'SELECT * FROM suppliers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, supplier: Partial<Supplier>): Promise<Supplier | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(supplier).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM suppliers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
