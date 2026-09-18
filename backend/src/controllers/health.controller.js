/**
 * Health Controller
 * Handles GET /api/health requests to confirm system status.
 */
const getHealth = (req, res, next) => {
  try {
    return res.status(200).json({
      status: 'ok',
      service: 'Dristi AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};
