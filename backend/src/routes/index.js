const express = require('express');
const healthRoutes = require('./health.routes');
const screeningRoutes = require('./screening.routes');

const router = express.Router();

// Mount Primary API Sub-Routers
router.use('/health', healthRoutes);
router.use('/screenings', screeningRoutes);

module.exports = router;
