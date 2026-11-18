import pool from '../config/db.js';

export const User = {
  async create({ name, email, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, bio, avatar_url, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async updateProfile(id, { name, bio, avatar_url }) {
    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
      [name, bio, avatar_url, id]
    );
    return this.findById(id);
  },
};
