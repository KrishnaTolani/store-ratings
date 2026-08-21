export function publicUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    address: row.address,
    role: row.role,
  };
}

export function mapStore(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    address: row.address,
    ownerId: row.owner_id != null ? String(row.owner_id) : null,
    averageRating: row.average_rating != null ? Number(row.average_rating) : 0,
    ratingCount: row.rating_count != null ? Number(row.rating_count) : 0,
    coverUrl: row.cover_url || null,
  };
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
