import pool from '../config/db.js';

export const Favorite = {
  async add(userId, destinationId) {
    await pool.query('INSERT IGNORE INTO favorites (user_id, destination_id) VALUES (?, ?)', [userId, destinationId]);
  },

  async remove(userId, destinationId) {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND destination_id = ?', [userId, destinationId]);
  },

  async ids(userId) {
    const [rows] = await pool.query('SELECT destination_id FROM favorites WHERE user_id = ?', [userId]);
    return rows.map((r) => r.destination_id);
  },

  async listDestinations(userId) {
    const [rows] = await pool.query(
      `SELECT d.* FROM favorites f
         JOIN destinations d ON d.id = f.destination_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  },
};
