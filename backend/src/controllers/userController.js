import { query } from "../config/db.js";
import { HttpError, mapStore } from "../utils/helpers.js";
import { validateRating } from "../utils/validation.js";

const ALLOWED_EMOJIS = ["😊", "😍", "👍", "🔥", "❤️", "😮", "😢", "👎"];

function sanitizeReview(body) {
  const value = Number(body.value);
  const err = validateRating(value);
  if (err) throw new HttpError(err);

  const comment = String(body.comment ?? "").trim();
  if (comment.length > 400) throw new HttpError("Comment must be at most 400 characters.");

  const emoji = String(body.emoji ?? "").trim();
  if (emoji && !ALLOWED_EMOJIS.includes(emoji)) throw new HttpError("Choose a valid emoji.");

  return { value, comment: comment || null, emoji: emoji || null };
}

function mapReview(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: row.name,
    value: Number(row.value),
    comment: row.comment || "",
    emoji: row.emoji || "",
    createdAt: new Date(row.updated_at || row.created_at).toISOString(),
  };
}

export async function getStores(req, res) {
  const userId = req.user.id;

  const rows = await query(
    `
    SELECT
      s.id,
      s.name,
      s.email,
      s.address,
      s.owner_id,
      COALESCE(ROUND(AVG(r.value), 1), 0) AS average_rating,
      COUNT(r.id) AS rating_count,
      (
        SELECT p.url FROM store_photos p
        WHERE p.store_id = s.id
        ORDER BY p.sort_order ASC, p.id ASC
        LIMIT 1
      ) AS cover_url,
      (
        SELECT mr.value FROM ratings mr
        WHERE mr.store_id = s.id AND mr.user_id = :userId
        LIMIT 1
      ) AS my_rating
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    GROUP BY s.id
    ORDER BY s.name ASC
    `,
    { userId },
  );

  res.json(
    rows.map((row) => ({
      ...mapStore(row),
      coverUrl: row.cover_url || null,
      myRating: row.my_rating != null ? Number(row.my_rating) : null,
    })),
  );
}

export async function getStoreById(req, res) {
  const storeId = Number(req.params.storeId);
  if (!Number.isInteger(storeId)) throw new HttpError("Invalid store.");

  const stores = await query(
    `
    SELECT
      s.id,
      s.name,
      s.email,
      s.address,
      s.owner_id,
      COALESCE(ROUND(AVG(r.value), 1), 0) AS average_rating,
      COUNT(r.id) AS rating_count
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE s.id = :storeId
    GROUP BY s.id
    LIMIT 1
    `,
    { storeId },
  );
  if (!stores.length) throw new HttpError("Store not found.", 404);

  const photos = await query(
    "SELECT url FROM store_photos WHERE store_id = :storeId ORDER BY sort_order ASC, id ASC",
    { storeId },
  );

  const reviews = await query(
    `
    SELECT r.id, r.user_id, u.name, r.value, r.comment, r.emoji, r.created_at, r.updated_at
    FROM ratings r
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.store_id = :storeId
    ORDER BY COALESCE(r.updated_at, r.created_at) DESC
    `,
    { storeId },
  );

  const mine = reviews.find((r) => String(r.user_id) === String(req.user.id));

  res.json({
    store: mapStore(stores[0]),
    photos: photos.map((p) => p.url),
    reviews: reviews.map(mapReview),
    myReview: mine
      ? {
          value: Number(mine.value),
          comment: mine.comment || "",
          emoji: mine.emoji || "",
        }
      : null,
  });
}

export async function submitRating(req, res) {
  const storeId = Number(req.params.storeId);
  if (!Number.isInteger(storeId)) throw new HttpError("Invalid store.");
  const { value, comment, emoji } = sanitizeReview(req.body);

  const stores = await query("SELECT id FROM stores WHERE id = :id LIMIT 1", { id: storeId });
  if (!stores.length) throw new HttpError("Store not found.", 404);

  const existing = await query(
    "SELECT id FROM ratings WHERE user_id = :userId AND store_id = :storeId LIMIT 1",
    { userId: req.user.id, storeId },
  );
  if (existing.length) throw new HttpError("You have already rated this store. Use update instead.", 409);

  const result = await query(
    `INSERT INTO ratings (user_id, store_id, value, comment, emoji)
     VALUES (:userId, :storeId, :value, :comment, :emoji)`,
    { userId: req.user.id, storeId, value, comment, emoji },
  );

  const rows = await query("SELECT id, user_id, store_id, value, comment, emoji, created_at FROM ratings WHERE id = :id", {
    id: result.insertId,
  });

  res.status(201).json({
    id: String(rows[0].id),
    userId: String(rows[0].user_id),
    storeId: String(rows[0].store_id),
    value: Number(rows[0].value),
    comment: rows[0].comment || "",
    emoji: rows[0].emoji || "",
    createdAt: new Date(rows[0].created_at).toISOString(),
  });
}

export async function updateRating(req, res) {
  const storeId = Number(req.params.storeId);
  if (!Number.isInteger(storeId)) throw new HttpError("Invalid store.");
  const { value, comment, emoji } = sanitizeReview(req.body);

  const existing = await query(
    "SELECT id FROM ratings WHERE user_id = :userId AND store_id = :storeId LIMIT 1",
    { userId: req.user.id, storeId },
  );
  if (!existing.length) throw new HttpError("You have not rated this store yet.", 404);

  await query(
    "UPDATE ratings SET value = :value, comment = :comment, emoji = :emoji WHERE id = :id",
    { value, comment, emoji, id: existing[0].id },
  );

  const rows = await query(
    "SELECT id, user_id, store_id, value, comment, emoji, created_at, updated_at FROM ratings WHERE id = :id",
    { id: existing[0].id },
  );

  res.json({
    id: String(rows[0].id),
    userId: String(rows[0].user_id),
    storeId: String(rows[0].store_id),
    value: Number(rows[0].value),
    comment: rows[0].comment || "",
    emoji: rows[0].emoji || "",
    createdAt: new Date(rows[0].updated_at || rows[0].created_at).toISOString(),
  });
}
