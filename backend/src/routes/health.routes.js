const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * Health Routes
 * All routes under /api/health
 */
router.get('/', getHealth);

module.exports = router;
