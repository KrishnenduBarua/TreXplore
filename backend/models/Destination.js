import pool from "../config/db.js";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const Destination = {
  async findAll({ division, district, category, q } = {}) {
    let sql = "SELECT * FROM destinations WHERE 1=1";
    const params = [];

    if (division) {
      sql += " AND division = ?";
      params.push(division);
    }
    if (district) {
      sql += " AND district LIKE ?";
      params.push(`%${district}%`);
    }
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (q) {
      sql +=
        " AND (name LIKE ? OR short_description LIKE ? OR description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      "SELECT * FROM destinations WHERE slug = ?",
      [slug],
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM destinations WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  async create(data, userId) {
    const slug = slugify(data.name);
    const [result] = await pool.query(
      `INSERT INTO destinations
        (name, slug, division, district, category, short_description, description, how_to_reach, best_time_to_visit, entry_fee, image_url, latitude, longitude, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        slug,
        data.division,
        data.district,
        data.category || "General",
        data.short_description || null,
        data.description || null,
        data.how_to_reach || null,
        data.best_time_to_visit || null,
        data.entry_fee || "Free",
        data.image_url || null,
        data.latitude || null,
        data.longitude || null,
        userId,
      ],
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      "name",
      "division",
      "district",
      "category",
      "short_description",
      "description",
      "how_to_reach",
      "best_time_to_visit",
      "entry_fee",
      "image_url",
      "latitude",
      "longitude",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (data.name) {
      fields.push("slug = ?");
      params.push(slugify(data.name));
    }
    if (!fields.length) return this.findById(id);

    params.push(id);
    await pool.query(
      `UPDATE destinations SET ${fields.join(", ")} WHERE id = ?`,
      params,
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query("DELETE FROM destinations WHERE id = ?", [id]);
  },
};
