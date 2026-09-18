const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const screeningController = require('../controllers/screening.controller');

// Multer storage configuration for uploaded fundus photographs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `fundus-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

/**
 * @route   POST /api/screenings
 * @desc    Submit, validate, and persist screening record to MongoDB Atlas
 * @access  Public
 */
router.post('/', upload.single('fundusImage'), screeningController.createScreening);

/**
 * @route   GET /api/screenings
 * @desc    Retrieve paginated screening history sorted newest first
 * @access  Public
 */
router.get('/', screeningController.getHistory);

/**
 * @route   GET /api/screenings/:id
 * @desc    Retrieve single screening record by Mongo ID
 * @access  Public
 */
router.get('/:id', screeningController.getById);

module.exports = router;
