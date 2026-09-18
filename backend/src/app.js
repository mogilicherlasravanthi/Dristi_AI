const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Configure CORS for local development with React frontend
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (uploaded fundus photos & generated Grad-CAM heatmaps/overlays)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../../ml/reports')));

// Root API Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Dristi AI Backend Service',
    service: 'Dristi AI Backend',
    healthCheck: '/api/health',
    docs: 'Refer to backend/README.md for API documentation.'
  });
});

// Register Primary API Router under /api
app.use('/api', apiRoutes);

// Unknown API Route Handler (404)
app.use(notFoundHandler);

// Centralized Error Handler (500)
app.use(errorHandler);

module.exports = app;
