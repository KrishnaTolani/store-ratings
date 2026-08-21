import { query } from "../config/db.js";
import { mapStore } from "../utils/helpers.js";

export async function getDashboard(req, res) {
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
    WHERE s.owner_id = :ownerId
    GROUP BY s.id
    LIMIT 1
    `,
    { ownerId: req.user.id },
  );

  if (!stores.length) {
    return res.json({ store: null, averageRating: 0, raters: [] });
  }

  const store = mapStore(stores[0]);
  const raters = await query(
    `
    SELECT
      r.user_id,
      u.name,
      u.email,
      r.value,
      r.comment,
      r.emoji,
      r.created_at,
      r.updated_at
    FROM ratings r
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.store_id = :storeId
    ORDER BY COALESCE(r.updated_at, r.created_at) DESC
    `,
    { storeId: store.id },
  );

  res.json({
    store,
    averageRating: store.averageRating,
    raters: raters.map((r) => ({
      userId: String(r.user_id),
      name: r.name,
      email: r.email,
      value: Number(r.value),
      comment: r.comment || "",
      emoji: r.emoji || "",
      createdAt: new Date(r.updated_at || r.created_at).toISOString(),
    })),
  });
}
