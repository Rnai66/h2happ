export function buildItemFilters(req) {
  const filters = { isDeleted: { $ne: true } };
  const { q, status, minPrice, maxPrice, includeDeleted } = req.query;

  if (includeDeleted === "1") delete filters.isDeleted;
  if (q && q.trim()) filters.$text = { $search: q.trim() };
  if (status) filters.status = status;

  const price = {};
  if (minPrice !== undefined) price.$gte = Number(minPrice);
  if (maxPrice !== undefined) price.$lte = Number(maxPrice);
  if (Object.keys(price).length) filters.price = price;

  return filters;
}
