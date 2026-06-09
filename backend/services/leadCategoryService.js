import { query, queryOne } from "../db.js";

let cachedCategories = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

export async function getAllCategories(force = false) {
  const now = Date.now();
  if (!force && cachedCategories && (now - lastFetch) < CACHE_TTL) {
    return cachedCategories;
  }
  const rows = await query("SELECT * FROM lead_categories WHERE is_active = 1 ORDER BY id ASC");
  cachedCategories = rows;
  lastFetch = now;
  return rows;
}

export async function getCategoryByName(name) {
  return queryOne("SELECT * FROM lead_categories WHERE name = ?", [name]);
}

export async function createCategory({ name, label, color, icon, keywords }) {
  await query(
    `INSERT INTO lead_categories (name, label, color, icon, keywords) VALUES (?, ?, ?, ?, ?)`,
    [name, label, color || "#1877F2", icon || "📊", keywords ? JSON.stringify(keywords) : "[]"]
  );
  getAllCategories(true);
  return getCategoryByName(name);
}

export async function updateCategory(id, { name, label, color, icon, keywords, is_active }) {
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push("name = ?"); params.push(name); }
  if (label !== undefined) { sets.push("label = ?"); params.push(label); }
  if (color !== undefined) { sets.push("color = ?"); params.push(color); }
  if (icon !== undefined) { sets.push("icon = ?"); params.push(icon); }
  if (keywords !== undefined) { sets.push("keywords = ?"); params.push(JSON.stringify(keywords)); }
  if (is_active !== undefined) { sets.push("is_active = ?"); params.push(is_active); }
  if (sets.length === 0) return null;
  params.push(id);
  await query(`UPDATE lead_categories SET ${sets.join(", ")} WHERE id = ?`, params);
  getAllCategories(true);
  return getCategoryByName(name);
}

export async function deleteCategory(id) {
  await query("DELETE FROM lead_categories WHERE id = ?", [id]);
  getAllCategories(true);
}

export function matchKeywords(text, keywords) {
  if (!text || !keywords || !Array.isArray(keywords) || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.some(kw => {
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s|[.,!?;])`, 'i');
    return regex.test(lower);
  });
}
