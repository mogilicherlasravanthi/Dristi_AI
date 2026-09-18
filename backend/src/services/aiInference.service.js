const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Runs the Python AI inference pipeline (ml/inference.py) on an uploaded fundus image.
 *
 * @param {string} imagePath - Path to the image file to analyze
 * @param {string} patientId - Patient ID string
 * @returns {Promise<Object>} Structured inference result containing IQA, DR prediction, and Grad-CAM paths
 */
const runAiInference = async (imagePath, patientId = 'P-UNSPECIFIED') => {
  return new Promise((resolve, reject) => {
    const projectRoot = path.resolve(__dirname, '../../..');
    const scriptPath = path.join(projectRoot, 'ml', 'inference.py');

    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Python inference script not found at: ${scriptPath}`));
    }

    // Determine Python executable path
    const defaultWinPython = 'C:\\Users\\Sravanthi\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
    const pythonExec =
      process.env.PYTHON_PATH ||
      (fs.existsSync(defaultWinPython) ? defaultWinPython : 'python');

    const outputDir = path.join(projectRoot, 'ml', 'reports', 'gradcam');
    const absoluteImagePath = path.resolve(imagePath);

    const args = [
      scriptPath,
      '--image', absoluteImagePath,
      '--patient-id', patientId,
      '--output-dir', outputDir
    ];

    console.log(`[AI Inference Service] Spawning process: ${pythonExec} ${args.join(' ')}`);

    const pyProcess = spawn(pythonExec, args, {
      cwd: projectRoot,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('error', (err) => {
      console.error('[AI Inference Service] Process spawn error:', err);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`[AI Inference Service] Python script exited with code ${code}. Stderr:`, stderrData);
        return reject(new Error(`Python inference failed with code ${code}: ${stderrData || 'Unknown error'}`));
      }

      try {
        const jsonOutput = JSON.parse(stdoutData.trim());
        if (jsonOutput.success === false && jsonOutput.error) {
          return reject(new Error(`Python inference reported error: ${jsonOutput.error}`));
        }
        resolve(jsonOutput);
      } catch (parseErr) {
        console.error('[AI Inference Service] Failed to parse JSON output:', stdoutData);
        reject(new Error(`Invalid JSON output from Python script: ${parseErr.message}`));
      }
    });
  });
};

module.exports = {
  runAiInference
};
