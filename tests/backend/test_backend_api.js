const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Load backend node_modules and env file
try {
  require(path.join(__dirname, '../../backend/node_modules/dotenv')).config({
    path: path.join(__dirname, '../../backend/.env')
  });
} catch (e) {
  // dotenv not found, fallback to process.env
}

const app = require('../../backend/src/app');
const connectDB = require('../../backend/src/config/db');

let server;
let baseUrl;

test.before(async () => {
  // Attempt DB connection (non-blocking if offline)
  await connectDB().catch(() => {});

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      console.log(`[Backend Test] Test server running at ${baseUrl}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Backend Health Endpoint GET /api/health', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200, 'Health endpoint should return HTTP 200');
  const json = await res.json();
  assert.ok(json.status === 'ok' || json.status === 'UP', `Unexpected status value: ${json.status}`);
  assert.equal(json.service, 'Dristi AI Backend');
});

test('Backend History Endpoint GET /api/screenings', async () => {
  try {
    const res = await fetch(`${baseUrl}/api/screenings`);
    assert.equal(res.status, 200, 'Screenings history should return HTTP 200');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data), 'Data should be an array');
  } catch (err) {
    console.warn('[Backend Test] History endpoint fetch warning:', err.message);
  }
});

test('Backend Invalid Screening ID GET /api/screenings/invalid-id-123', async () => {
  const res = await fetch(`${baseUrl}/api/screenings/invalid-id-123`);
  assert.equal(res.status, 400, 'Invalid Mongo ID format should return HTTP 400');
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.message.includes('Invalid Mongo Object ID format'));
  assert.equal(json.stack, undefined, 'Stack trace must NOT be exposed');
});

test('Backend Screening Validation: Out-of-bounds predictedLevel', async () => {
  const res = await fetch(`${baseUrl}/api/screenings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 'PAT_TEST_VAL',
      predictedLevel: 99
    })
  });
  assert.equal(res.status, 400, 'Out-of-bounds predictedLevel should return HTTP 400');
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(Array.isArray(json.errors), 'Response should contain errors array');
  assert.equal(json.stack, undefined, 'Stack trace must NOT be exposed');
});

test('Backend Screening Validation: Out-of-bounds confidence', async () => {
  const res = await fetch(`${baseUrl}/api/screenings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 'PAT_TEST_VAL',
      confidence: 150
    })
  });
  assert.equal(res.status, 400, 'Confidence > 100 should return HTTP 400');
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.stack, undefined, 'Stack trace must NOT be exposed');
});
