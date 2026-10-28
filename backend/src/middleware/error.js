function notFound(req, res, next) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) console.error(err);
  const message =
    status >= 500 && isProd ? 'Something went wrong' : err.message || 'Request failed';
  res.status(status).json({ message });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };
