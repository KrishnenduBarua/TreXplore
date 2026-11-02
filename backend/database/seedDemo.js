// Seeds three demo travelers with distinct tastes so the AI recommendations
// have something to learn from. Run AFTER `npm run seed`:  npm run seed:demo
//
// Demo logins (password for all: Demo@123)
//   beach@trexplore.com     – loves beaches, coastal Chattogram/Barishal
//   heritage@trexplore.com  – loves UNESCO sites and historic buildings
//   nature@trexplore.com    – loves forests, tea gardens, eco parks
//
// Log in as one of them and open "For You" to see personalised results.
// Re-running is safe: it resets the demo users' activity each time.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// [event type, destination name or null, days ago, extra filter fields]
const personas = [
  {
    name: 'Beach Lover (demo)', email: 'beach@trexplore.com',
    saves: ["Cox's Bazar Beach", 'Kuakata Sea Beach'],
    events: [
      ['view', "Cox's Bazar Beach", 6], ['view', "Cox's Bazar Beach", 2], ['view', 'Kuakata Sea Beach', 4],
      ['view', 'Sajek Valley', 3], ['filter', null, 5, { category: 'Beach' }], ['filter', null, 1, { category: 'Beach' }],
      ['filter', null, 3, { division: 'Chattogram' }],
    ],
  },
  {
    name: 'Heritage Explorer (demo)', email: 'heritage@trexplore.com',
    saves: ['Paharpur Buddhist Vihara', 'Sixty Dome Mosque'],
    events: [
      ['view', 'Paharpur Buddhist Vihara', 8], ['view', 'Sixty Dome Mosque', 5], ['view', 'Ahsan Manzil', 2],
      ['filter', null, 4, { category: 'Heritage' }], ['filter', null, 1, { category: 'Heritage' }],
      ['view', 'Sundarbans', 3],
    ],
  },
  {
    name: 'Nature Wanderer (demo)', email: 'nature@trexplore.com',
    saves: ['Sundarbans', 'Srimangal Tea Gardens', 'Madhutila Eco Park'],
    events: [
      ['view', 'Sundarbans', 7], ['view', 'Ratargul Swamp Forest', 5], ['view', 'Srimangal Tea Gardens', 3],
      ['view', 'Madhutila Eco Park', 2], ['filter', null, 4, { category: 'Forest' }], ['filter', null, 2, { category: 'Nature' }],
      ['view', 'Sajek Valley', 1],
    ],
  },
];

async function seedDemo() {
  const conn = await pool.getConnection();
  try {
    const [dests] = await conn.query('SELECT id, slug FROM destinations');
    if (!dests.length) {
      console.error('No destinations found. Run `npm run seed` first.');
      return;
    }
    const idByName = (name) => dests.find((d) => d.slug === slugify(name))?.id;
    const hash = await bcrypt.hash('Demo@123', 10);

    for (const p of personas) {
      await conn.query(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'traveler')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [p.name, p.email, hash]
      );
      const [[user]] = await conn.query('SELECT id FROM users WHERE email = ?', [p.email]);

      await conn.query('DELETE FROM user_events WHERE user_id = ?', [user.id]);
      await conn.query('DELETE FROM favorites WHERE user_id = ?', [user.id]);

      for (const name of p.saves) {
        const id = idByName(name);
        if (id) await conn.query('INSERT IGNORE INTO favorites (user_id, destination_id, created_at) VALUES (?, ?, NOW() - INTERVAL 1 DAY)', [user.id, id]);
      }
      for (const [type, name, daysAgo, extra = {}] of p.events) {
        const destId = name ? idByName(name) : null;
        if (name && !destId) continue;
        await conn.query(
          `INSERT INTO user_events (user_id, destination_id, category, division, event_type, created_at)
           VALUES (?, ?, ?, ?, ?, NOW() - INTERVAL ? DAY)`,
          [user.id, destId, extra.category || null, extra.division || null, type, daysAgo]
        );
      }
      console.log(`Seeded ${p.email}`);
    }
    console.log('Done. Log in with any demo email and password Demo@123, then open "For You".');
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
