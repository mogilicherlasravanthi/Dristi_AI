const Screening = require('../models/screening.model');

/**
 * Save completed screening record to MongoDB Atlas
 */
const createScreeningRecord = async (screeningData) => {
  const record = new Screening(screeningData);
  const savedRecord = await record.save();
  return savedRecord;
};

/**
 * Retrieve paginated screening history sorted newest first
 */
const getScreeningHistory = async ({ page = 1, limit = 10, search = '' }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (search && search.trim()) {
    query.patientId = { $regex: search.trim(), $options: 'i' };
  }

  const [screenings, total] = await Promise.all([
    Screening.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Screening.countDocuments(query)
  ]);

  return {
    screenings,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * Retrieve single screening record by MongoDB ID
 */
const getScreeningById = async (id) => {
  const record = await Screening.findById(id).lean();
  return record;
};

module.exports = {
  createScreeningRecord,
  getScreeningHistory,
  getScreeningById
};
