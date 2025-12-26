export function parsePaging(req) {
  const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10) || 20));
  const skip = (page - 1) * limit;
  const sort = (req.query.sort || "-createdAt").toString(); // ex: price,-price
  return { page, limit, skip, sort };
}
