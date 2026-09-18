/**
 * Centralized Error Handling Middleware
 * Formats API errors into consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack ? err.stack : '');

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
