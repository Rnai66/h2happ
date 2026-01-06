export function notFound(req, res, next) {
  res.status(404).json({ message: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const payload = { message: err.message || "Server Error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  res.status(status).json(payload);
}
