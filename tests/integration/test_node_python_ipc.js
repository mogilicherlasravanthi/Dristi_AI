const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { runAiInference } = require('../../backend/src/services/aiInference.service');

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../dataset/prepared/test/Mild/0369f3efe69b.png');

test('Python <-> Node IPC Integration Audit (Real Image, No Mocks)', async () => {
  assert.ok(fs.existsSync(TEST_IMAGE_PATH), `Test image missing at ${TEST_IMAGE_PATH}`);

  console.log('[IPC Audit] Triggering runAiInference on real test image...');
  const result = await runAiInference(TEST_IMAGE_PATH, 'IPC_TEST_PATIENT');

  assert.equal(result.success, true, 'AI inference response success flag should be true');
  assert.equal(result.patientId, 'IPC_TEST_PATIENT');
  assert.equal(result.processingStatus, 'COMPLETED');

  // Verify Quality Assessment Output
  assert.ok(result.imageQuality, 'Result must contain imageQuality data');
  assert.ok(['GOOD', 'BORDERLINE', 'UNGRADABLE'].includes(result.imageQuality.status));
  assert.equal(typeof result.imageQuality.score, 'number');

  // Verify DR Prediction Output
  assert.equal(typeof result.predictedLevel, 'number');
  assert.ok(result.predictedLevel >= 0 && result.predictedLevel <= 4);
  assert.equal(typeof result.predictedClass, 'string');
  assert.equal(typeof result.confidence, 'number');
  assert.ok(result.confidence >= 0 && result.confidence <= 100);

  // Verify Probabilities Dictionary
  assert.ok(result.probabilities, 'Result must contain probabilities object');
  assert.equal(Object.keys(result.probabilities).length, 5);

  // Verify Grad-CAM References
  assert.ok(result.heatmapPath, 'Result must contain Grad-CAM heatmap path');
  assert.ok(result.overlayPath, 'Result must contain Grad-CAM overlay path');
  assert.ok(fs.existsSync(result.heatmapPath), `Heatmap file must exist on disk: ${result.heatmapPath}`);
  assert.ok(fs.existsSync(result.overlayPath), `Overlay file must exist on disk: ${result.overlayPath}`);

  // Verify Referral Output
  assert.ok(['ROUTINE', 'REFERRAL_RECOMMENDED', 'SPECIALIST_REVIEW', 'RECAPTURE_REQUIRED'].includes(result.referralStatus));
  assert.equal(typeof result.referralReason, 'string');
});
