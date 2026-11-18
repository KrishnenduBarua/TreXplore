import pool from '../config/db.js';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

export const Blog = {
  async findAll({ userId, destinationId } = {}) {
    let sql = `
      SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar, d.name AS destination_name
      FROM blogs b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN destinations d ON d.id = b.destination_id
      WHERE b.status = 'published'`;
    const params = [];

    if (userId) {
      sql += ' AND b.user_id = ?';
      params.push(userId);
    }
    if (destinationId) {
      sql += ' AND b.destination_id = ?';
      params.push(destinationId);
    }
    sql += ' ORDER BY b.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS author_name, u.avatar_url AS author_avatar, d.name AS destination_name, d.slug AS destination_slug
       FROM blogs b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN destinations d ON d.id = b.destination_id
       WHERE b.slug = ?`,
      [slug]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ userId, title, content, destinationId, coverImageUrl }) {
    const slug = slugify(title);
    const [result] = await pool.query(
      `INSERT INTO blogs (user_id, destination_id, title, slug, cover_image_url, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, destinationId || null, title, slug, coverImageUrl || null, content]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['title', 'content', 'cover_image_url', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return this.findById(id);
    params.push(id);
    await pool.query(`UPDATE blogs SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
  },
};
