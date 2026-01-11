import pool from '../config/database';

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class CustomerModel {
  static async create(customer: Customer): Promise<Customer> {
    const query = `
      INSERT INTO customers (name, email, phone, address, city, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.city,
      customer.notes
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(isActive?: boolean): Promise<Customer[]> {
    let query = 'SELECT * FROM customers';
    const values: any[] = [];

    if (isActive !== undefined) {
      query += ' WHERE is_active = $1';
      values.push(isActive);
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id: number): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, customer: Partial<Customer>): Promise<Customer | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(customer).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM customers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
