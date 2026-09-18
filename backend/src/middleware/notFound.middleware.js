/**
 * 404 Not Found Middleware
 * Intercepts requests to unregistered endpoints and returns a structured JSON error response.
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFoundHandler;
