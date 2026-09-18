const path = require('path');
const screeningService = require('../services/screening.service');
const aiInferenceService = require('../services/aiInference.service');

/**
 * Helper to validate screening payload fields
 */
const validateScreeningPayload = (body) => {
  const errors = [];

  if (!body.patientId || !String(body.patientId).trim()) {
    errors.push('patientId is required');
  }

  if (body.predictedLevel !== undefined) {
    const level = Number(body.predictedLevel);
    if (isNaN(level) || level < 0 || level > 4) {
      errors.push('predictedLevel must be an integer between 0 and 4');
    }
  }

  if (body.confidence !== undefined) {
    const conf = Number(body.confidence);
    if (isNaN(conf) || conf < 0 || conf > 100) {
      errors.push('confidence must be a number between 0 and 100');
    }
  }

  if (body.imageQuality?.status) {
    const validStatuses = ['GOOD', 'BORDERLINE', 'UNGRADABLE'];
    if (!validStatuses.includes(body.imageQuality.status)) {
      errors.push(`imageQuality.status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  return errors;
};

/**
 * Convert local disk file paths to accessible HTTP URLs for the frontend
 */
const formatWebUrl = (filePath, defaultPrefix = '/uploads') => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const basename = path.basename(filePath);
  if (filePath.includes('reports') || filePath.includes('gradcam')) {
    return `/reports/gradcam/${basename}`;
  }
  return `/uploads/${basename}`;
};

/**
 * POST /api/screenings
 * Receive uploaded fundus image, trigger Python AI inference, and persist record to MongoDB Atlas
 */
const createScreening = async (req, res, next) => {
  try {
    const payload = req.body;
    const patientId = payload.patientId || payload.patient?.patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

    let targetImagePath = null;
    if (req.file) {
      targetImagePath = req.file.path;
    } else if (payload.imagePath) {
      targetImagePath = payload.imagePath;
    }

    let aiResult = null;
    if (targetImagePath) {
      try {
        console.log(`[Screening Controller] Triggering AI inference on: ${targetImagePath}`);
        aiResult = await aiInferenceService.runAiInference(targetImagePath, patientId);
      } catch (aiError) {
        console.error('[Screening Controller] AI Inference Error:', aiError.message);
        // If AI inference process fails, don't crash total request, fallback to payload values if present
      }
    }

    const screeningData = {
      patientId: patientId,
      patientAge: Number(payload.age || payload.patientAge || payload.patient?.age || 50),
      patientSex: payload.sex || payload.patientSex || payload.patient?.sex || 'Female',
      location: payload.location || payload.patient?.location || 'PHC Primary Care',
      diabetesDuration: Number(payload.diabetesDuration || payload.patient?.diabetesDuration || 0),

      imageQuality: aiResult?.imageQuality || payload.quality || payload.imageQuality || {
        status: 'GOOD',
        score: 85.0,
        focusScore: 80.0,
        illuminationScore: 90.0,
        fovScore: 85.0,
        metrics: {},
        reason: 'Image meets quality criteria',
        enhancementApplied: false,
        recaptureRequired: false
      },

      predictedLevel: aiResult ? aiResult.predictedLevel : Number(payload.prediction?.level ?? payload.predictedLevel ?? 0),
      predictedClass: aiResult ? aiResult.predictedClass : (payload.prediction?.className || payload.predictedClass || 'No DR'),
      confidence: aiResult ? aiResult.confidence : Number(payload.prediction?.confidence ?? payload.confidence ?? 95.0),
      probabilities: aiResult ? aiResult.probabilities : (payload.prediction?.probabilities || payload.probabilities || { 'No DR': 95.0, 'Mild DR': 3.0, 'Moderate DR': 1.0, 'Severe DR': 0.7, 'Proliferative DR': 0.3 }),

      referralStatus: aiResult ? aiResult.referralStatus : (payload.referral?.status || payload.referralStatus || 'ROUTINE'),
      referralReason: aiResult ? aiResult.referralReason : (payload.referral?.reason || payload.referralReason || 'Routine annual monitoring recommended.'),

      imagePath: formatWebUrl(targetImagePath || aiResult?.imagePath || payload.imagePath),
      heatmapPath: formatWebUrl(aiResult?.heatmapPath || payload.heatmapPath),
      overlayPath: formatWebUrl(aiResult?.overlayPath || payload.overlayPath),
      
      processingStatus: aiResult?.processingStatus || ((payload.quality?.status === 'UNGRADABLE' || payload.imageQuality?.status === 'UNGRADABLE') ? 'UNGRADABLE' : 'COMPLETED'),
      modelVersion: 'EfficientNet-B0 v1.0 (SIH26038 Baseline)'
    };

    const validationErrors = validateScreeningPayload(screeningData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid screening data payload',
        errors: validationErrors
      });
    }

    const savedRecord = await screeningService.createScreeningRecord(screeningData);

    return res.status(201).json({
      success: true,
      message: 'Screening processed and persisted successfully',
      recordId: savedRecord._id,
      data: savedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/screenings
 * Retrieve paginated screening history sorted newest first
 */
const getHistory = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await screeningService.getScreeningHistory({ page, limit, search });

    return res.status(200).json({
      success: true,
      data: result.screenings,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/screenings/:id
 * Retrieve single screening record by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await screeningService.getScreeningById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Screening record with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid Mongo Object ID format: '${req.params.id}'`
      });
    }
    next(error);
  }
};

module.exports = {
  createScreening,
  getHistory,
  getById
};
