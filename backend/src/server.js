require('dotenv').config();
const path = require('path');
const fs = require('fs');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists for image storage
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB Atlas
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Dristi AI Backend Service Initialized`);
    console.log(`📍 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server Port : ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });

  // Graceful Shutdown Handler
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down HTTP server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
    });
  });
});
