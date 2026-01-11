import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'employee';
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  // Créer un nouvel utilisateur
  static async create(user: User): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const query = `
      INSERT INTO users (username, email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at
    `;
    const values = [
      user.username,
      user.email,
      hashedPassword,
      user.first_name,
      user.last_name,
      user.role || 'employee'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver un utilisateur par email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Trouver un utilisateur par username
  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  // Trouver un utilisateur par ID
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Obtenir tous les utilisateurs
  static async findAll(): Promise<User[]> {
    const query = 'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Mettre à jour un utilisateur
  static async update(id: number, user: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (user.username) {
      fields.push(`username = $${paramCount++}`);
      values.push(user.username);
    }
    if (user.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(user.email);
    }
    if (user.first_name !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(user.first_name);
    }
    if (user.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(user.last_name);
    }
    if (user.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(user.role);
    }
    if (user.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(user.is_active);
    }
    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      fields.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Supprimer un utilisateur
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Vérifier le mot de passe
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
