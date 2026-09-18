const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

try {
  require(path.join(__dirname, '../../backend/node_modules/dotenv')).config({
    path: path.join(__dirname, '../../backend/.env')
  });
} catch (e) {}

const connectDB = require('../../backend/src/config/db');
const Screening = require('../../backend/src/models/screening.model');
const screeningService = require('../../backend/src/services/screening.service');

test('MongoDB Atlas Connectivity & CRUD Audit', async (t) => {
  let isConnected = false;
  try {
    const conn = await connectDB();
    isConnected = !!conn && conn.connection?.readyState === 1;
  } catch (err) {
    console.error('[MongoDB Audit] Connection failed:', err.message);
  }

  if (!isConnected) {
    console.warn('[MongoDB Audit] Marking BLOCKED — MongoDB unavailable (Connection timeout / IP whitelist)');
    t.skip('BLOCKED — MongoDB unavailable');
    return;
  }

  // 1. Create synthetic test record
  const testPatientId = 'AUTOMATED_TEST';
  const testPayload = {
    patientId: testPatientId,
    patientAge: 50,
    patientSex: 'Female',
    location: 'Automated Audit Lab',
    diabetesDuration: 5,
    imageQuality: {
      status: 'GOOD',
      score: 85.0,
      focusScore: 80.0,
      illuminationScore: 90.0,
      fovScore: 85.0,
      reason: 'Automated test record'
    },
    predictedLevel: 0,
    predictedClass: 'No DR',
    confidence: 95.0,
    probabilities: { 'No DR': 95.0, 'Mild DR': 5.0 },
    referralStatus: 'ROUTINE',
    referralReason: 'Automated audit test record'
  };

  const savedRecord = await screeningService.createScreeningRecord(testPayload);
  assert.ok(savedRecord._id, 'Record must have valid Mongo ObjectId');
  assert.equal(savedRecord.patientId, testPatientId);

  // 2. Retrieve record by ID
  const retrieved = await screeningService.getScreeningById(savedRecord._id);
  assert.ok(retrieved, 'Should retrieve created screening record');
  assert.equal(retrieved.patientId, testPatientId);

  // 3. Query screening history
  const history = await screeningService.getScreeningHistory({ search: testPatientId });
  assert.ok(history.screenings.length > 0, 'Created record must appear in history search');

  // 4. Clean up test record from database
  await Screening.findByIdAndDelete(savedRecord._id);
  console.log(`[MongoDB Audit] Cleaned up automated test record ID: ${savedRecord._id}`);
});
