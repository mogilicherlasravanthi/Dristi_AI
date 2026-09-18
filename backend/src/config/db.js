const mongoose = require('mongoose');

/**
 * MongoDB Atlas Connection Configuration
 * Establishes Mongoose connection to process.env.MONGODB_URI
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Atlas Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Connection Failed: ${error.message}`);
    // Non-fatal fallback for development if database is unreachable
    return null;
  }
};

module.exports = connectDB;
