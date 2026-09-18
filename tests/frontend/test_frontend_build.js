const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

test('React Frontend Build & Component Bundle Audit', () => {
  const frontendDir = path.resolve(__dirname, '../../frontend');
  assert.ok(fs.existsSync(frontendDir), `Frontend directory missing at ${frontendDir}`);

  console.log('[Frontend Test] Executing vite build in frontend/...');
  try {
    const output = execSync('npm run build', { cwd: frontendDir, stdio: 'pipe' });
    console.log('[Frontend Test] Vite build succeeded!');
  } catch (err) {
    assert.fail(`Vite build failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }

  const distDir = path.join(frontendDir, 'dist');
  const indexHtml = path.join(distDir, 'index.html');

  assert.ok(fs.existsSync(distDir), 'Dist output directory must exist post-build');
  assert.ok(fs.existsSync(indexHtml), 'dist/index.html must exist post-build');
});
