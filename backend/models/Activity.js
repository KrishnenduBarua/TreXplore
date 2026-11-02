import pool from '../config/db.js';

// Minutes during which an identical action by the same user is not logged again
// (stops a page refresh from counting as extra interest).
const DEDUPE_MINUTES = { view: 30, blog_read: 30, filter: 10, blog_write: 0 };

// Only recent behaviour is used for learning; older rows are ignored.
const LOOKBACK_DAYS = 180;

export const Activity = {
  async record({ userId, destinationId = null, category = null, division = null, type }) {
    const minutes = DEDUPE_MINUTES[type] ?? 30;
    await pool.query(
      `INSERT INTO user_events (user_id, destination_id, category, division, event_type)
       SELECT ?, ?, ?, ?, ?
       FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM user_events
         WHERE user_id = ? AND event_type = ?
           AND destination_id <=> ? AND category <=> ? AND division <=> ?
           AND created_at > (NOW() - INTERVAL ? MINUTE)
       )`,
      [userId, destinationId, category, division, type, userId, type, destinationId, category, division, minutes]
    );
  },

  // Fire-and-forget: learning from behaviour must never slow down or break a
  // normal request, so errors are logged and swallowed.
  track(args) {
    this.record(args).catch((err) => console.error('[activity] could not record event:', err.message));
  },

  // Everything the recommender learns from: logged events plus saved places
  // (saves are folded in as 'favorite' events).
  async allEvents() {
    const [rows] = await pool.query(
      `SELECT user_id, destination_id, category, division, event_type, created_at
         FROM user_events
        WHERE created_at > (NOW() - INTERVAL ${LOOKBACK_DAYS} DAY)
       UNION ALL
       SELECT user_id, destination_id, NULL AS category, NULL AS division, 'favorite' AS event_type, created_at
         FROM favorites`
    );
    return rows;
  },
};
