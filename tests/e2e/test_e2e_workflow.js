const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

try {
  require(path.join(__dirname, '../../backend/node_modules/dotenv')).config({
    path: path.join(__dirname, '../../backend/.env')
  });
} catch (e) {}

const app = require('../../backend/src/app');
const connectDB = require('../../backend/src/config/db');

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../dataset/prepared/test/Mild/0369f3efe69b.png');

test('Full Genuine End-to-End Workflow Audit (No Mocks)', async () => {
  assert.ok(fs.existsSync(TEST_IMAGE_PATH), `Test image missing at ${TEST_IMAGE_PATH}`);

  // Connect to DB if available
  await connectDB().catch(() => {});

  // Start temporary Express listener
  const server = await new Promise((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });

  const port = server.address().port;
  const targetUrl = `http://127.0.0.1:${port}/api/screenings`;

  console.log(`[E2E Audit] Starting genuine E2E test targeting ${targetUrl}...`);
  const startTime = Date.now();

  const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('patientId', 'AUTOMATED_E2E_TEST');
  formData.append('age', '58');
  formData.append('sex', 'Female');
  formData.append('location', 'E2E Testing Clinic');
  formData.append('diabetesDuration', '10');
  formData.append('fundusImage', blob, '0369f3efe69b.png');

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData
    });

    const elapsedTimeSec = (Date.now() - startTime) / 1000;
    console.log(`[E2E Audit] E2E Pipeline Completed in ${elapsedTimeSec.toFixed(2)} seconds!`);

    assert.equal(response.status, 201, `Expected HTTP 201 Created, got ${response.status}`);
    const json = await response.json();
    assert.equal(json.success, true, 'Response success flag should be true');

    const rec = json.data;
    assert.equal(rec.patientId, 'AUTOMATED_E2E_TEST');

    // Stage 1: Quality Assessment Verification
    assert.ok(rec.imageQuality, 'E2E Stage 1: Quality Assessment missing');
    assert.ok(['GOOD', 'BORDERLINE', 'UNGRADABLE'].includes(rec.imageQuality.status));

    // Stage 2: DR Classification Verification
    assert.equal(typeof rec.predictedLevel, 'number');
    assert.ok(rec.predictedLevel >= 0 && rec.predictedLevel <= 4);
    assert.equal(typeof rec.predictedClass, 'string');
    assert.equal(typeof rec.confidence, 'number');

    // Stage 3: Grad-CAM Explainability Verification
    assert.ok(rec.heatmapPath, 'E2E Stage 3: Heatmap reference missing');
    assert.ok(rec.overlayPath, 'E2E Stage 3: Overlay reference missing');

    // Stage 4: Referral Support Verification
    assert.ok(['ROUTINE', 'REFERRAL_RECOMMENDED', 'SPECIALIST_REVIEW', 'RECAPTURE_REQUIRED'].includes(rec.referralStatus));

    console.log(`[E2E Audit Summary] Total E2E Execution Time: ${elapsedTimeSec.toFixed(2)}s | DR Level: ${rec.predictedLevel} (${rec.predictedClass}) | Referral: ${rec.referralStatus}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
