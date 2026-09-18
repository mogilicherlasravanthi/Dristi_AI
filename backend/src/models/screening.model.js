const mongoose = require('mongoose');

const QualityMetricsSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['GOOD', 'BORDERLINE', 'UNGRADABLE'],
      default: 'GOOD',
      required: true
    },
    score: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    illuminationScore: { type: Number, default: 0 },
    fovScore: { type: Number, default: 0 },
    metrics: { type: Object, default: {} },
    reason: { type: String, default: '' },
    enhancementApplied: { type: Boolean, default: false },
    recaptureRequired: { type: Boolean, default: false }
  },
  { _id: false }
);

const ScreeningSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      trim: true,
      index: true
    },
    patientAge: {
      type: Number,
      min: [1, 'Age must be positive'],
      max: [120, 'Age exceeds realistic limit']
    },
    patientSex: {
      type: String,
      enum: ['Female', 'Male', 'Other', 'Unknown'],
      default: 'Female'
    },
    location: {
      type: String,
      trim: true,
      default: 'PHC Primary Care'
    },
    diabetesDuration: {
      type: Number,
      min: 0,
      default: 0
    },
    screeningDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    imageQuality: {
      type: QualityMetricsSchema,
      required: true
    },
    predictedLevel: {
      type: Number,
      required: [true, 'Predicted DR Level (0-4) is required'],
      min: 0,
      max: 4
    },
    predictedClass: {
      type: String,
      required: [true, 'Predicted Class Name is required'],
      trim: true
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence percentage is required'],
      min: 0,
      max: 100
    },
    probabilities: {
      type: Map,
      of: Number,
      default: {}
    },
    referralStatus: {
      type: String,
      enum: ['ROUTINE', 'REFERRAL_RECOMMENDED', 'RECAPTURE_REQUIRED', 'SPECIALIST_REVIEW'],
      default: 'ROUTINE',
      required: true
    },
    referralReason: {
      type: String,
      default: ''
    },
    imagePath: {
      type: String,
      default: null
    },
    heatmapPath: {
      type: String,
      default: null
    },
    overlayPath: {
      type: String,
      default: null
    },
    processingStatus: {
      type: String,
      enum: ['COMPLETED', 'UNGRADABLE', 'FAILED'],
      default: 'COMPLETED'
    },
    modelVersion: {
      type: String,
      default: 'EfficientNet-B0 v1.0 (SIH26038 Baseline)'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast patient search and reverse chronological history
ScreeningSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('Screening', ScreeningSchema);
