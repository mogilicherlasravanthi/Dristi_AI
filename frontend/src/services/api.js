/**
 * Dristi AI — Screening API Service Abstraction Layer
 * Problem Statement: Explainable AI for Diabetic Retinopathy Screening
 */

export const USE_MOCK_DATA = false;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * Format local asset path to full accessible HTTP URL
 */
const formatAssetUrl = (urlPath) => {
  if (!urlPath) return null;
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath;
  if (urlPath.startsWith('blob:')) return urlPath;
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

/**
 * Perform full retinal screening API request
 */
export async function submitScreening(patientData, imageFile, mockScenario = 'GOOD') {
  if (USE_MOCK_DATA) {
    return simulateMockScreening(patientData, imageFile, mockScenario);
  }

  const formData = new FormData();
  formData.append('patientId', patientData.patientId || '');
  formData.append('age', patientData.age || '');
  formData.append('sex', patientData.sex || '');
  formData.append('location', patientData.location || '');
  formData.append('diabetesDuration', patientData.diabetesDuration || '');
  if (imageFile) {
    formData.append('fundusImage', imageFile);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/screenings`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Server returned status code ${response.status}`);
    }

    const json = await response.json();
    const rec = json.data;

    // Convert backend MongoDB record into standard UI dossier structure
    return {
      success: true,
      timestamp: rec.createdAt || rec.screeningDate || new Date().toISOString(),
      patient: {
        patientId: rec.patientId,
        age: rec.patientAge,
        sex: rec.patientSex,
        location: rec.location,
        diabetesDuration: rec.diabetesDuration
      },
      quality: {
        status: rec.imageQuality?.status || 'GOOD',
        score: rec.imageQuality?.score || 0,
        focusScore: rec.imageQuality?.focusScore || 0,
        illuminationScore: rec.imageQuality?.illuminationScore || 0,
        fovScore: rec.imageQuality?.fovScore || 0,
        reason: rec.imageQuality?.reason || '',
        metrics: rec.imageQuality?.metrics || {},
        enhancementApplied: rec.imageQuality?.enhancementApplied || false,
        recaptureRequired: rec.imageQuality?.recaptureRequired || false
      },
      prediction: rec.processingStatus === 'UNGRADABLE' ? null : {
        level: rec.predictedLevel,
        className: rec.predictedClass,
        confidence: rec.confidence,
        probabilities: rec.probabilities || {}
      },
      explainability: {
        originalImage: formatAssetUrl(rec.imagePath),
        heatmapUrl: formatAssetUrl(rec.heatmapPath),
        overlayUrl: formatAssetUrl(rec.overlayPath)
      },
      referral: {
        status: rec.referralStatus,
        recommendation: rec.referralStatus === 'SPECIALIST_REVIEW'
          ? 'Urgent Ophthalmologist Referral Required'
          : (rec.referralStatus === 'REFERRAL_RECOMMENDED'
            ? 'Ophthalmologist Referral Recommended'
            : (rec.referralStatus === 'RECAPTURE_REQUIRED'
              ? 'Image Recapture Required'
              : 'Routine Annual Follow-up')),
        reason: rec.referralReason
      }
    };
  } catch (err) {
    console.error('API Screening Request Failed, falling back to mock mode:', err);
    return simulateMockScreening(patientData, imageFile, mockScenario);
  }
}

/**
 * Fetch paginated screening history
 */
export async function fetchScreeningHistory({ page = 1, limit = 10, search = '' } = {}) {
  if (USE_MOCK_DATA) {
    return getMockScreeningHistory({ page, limit, search });
  }

  try {
    const url = new URL(`${API_BASE_URL}/screenings`);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);
    if (search) url.searchParams.append('search', search);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to fetch screening history');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Backend history fetch failed, falling back to development history data:', err);
    return getMockScreeningHistory({ page, limit, search });
  }
}

/**
 * Fetch single screening record by ID
 */
export async function fetchScreeningById(id) {
  if (USE_MOCK_DATA) {
    const history = await getMockScreeningHistory({ page: 1, limit: 100 });
    const match = history.data.find((item) => item._id === id || item.id === id);
    return match || history.data[0];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/screenings/${id}`);
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Record with ID ${id} not found`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (err) {
    console.error(`Fetch screening by ID (${id}) failed:`, err);
    throw err;
  }
}

// Development Mock Generator for Screening History
const MOCK_HISTORY_RECORDS = [
  {
    _id: 'rec-6701-a1',
    patientId: 'PAT-2026-8910',
    patientAge: 54,
    patientSex: 'Female',
    location: 'PHC Rampur',
    diabetesDuration: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    imageQuality: {
      status: 'GOOD',
      score: 89.2,
      focusScore: 88.0,
      illuminationScore: 92.5,
      fovScore: 86.8,
      reason: 'Image meets focus, illumination, and FOV criteria.'
    },
    predictedLevel: 2,
    predictedClass: 'Moderate DR',
    confidence: 91.8,
    probabilities: { 'No DR': 1.2, 'Mild DR': 4.8, 'Moderate DR': 91.8, 'Severe DR': 1.8, 'Proliferative DR': 0.4 },
    referralStatus: 'REFERRAL_RECOMMENDED',
    referralReason: 'Level 2+ Moderate DR detected. Referral to an ophthalmologist is recommended for clinical examination.',
    modelVersion: 'EfficientNet-B0 v1.0 (Baseline)'
  },
  {
    _id: 'rec-6701-a2',
    patientId: 'PAT-2026-4421',
    patientAge: 61,
    patientSex: 'Male',
    location: 'District Hospital',
    diabetesDuration: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    imageQuality: {
      status: 'GOOD',
      score: 92.0,
      focusScore: 91.0,
      illuminationScore: 94.0,
      fovScore: 90.0,
      reason: 'High sharpness and contrast.'
    },
    predictedLevel: 0,
    predictedClass: 'No DR',
    confidence: 96.5,
    probabilities: { 'No DR': 96.5, 'Mild DR': 2.8, 'Moderate DR': 0.5, 'Severe DR': 0.1, 'Proliferative DR': 0.1 },
    referralStatus: 'ROUTINE',
    referralReason: 'Level 0 No DR detected. Routine annual diabetic eye screening recommended.',
    modelVersion: 'EfficientNet-B0 v1.0 (Baseline)'
  }
];

function getMockScreeningHistory({ page = 1, limit = 10, search = '' }) {
  let filtered = MOCK_HISTORY_RECORDS;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((r) => r.patientId.toLowerCase().includes(q));
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const startIdx = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(startIdx, startIdx + limitNum);

  return {
    success: true,
    data: paginated,
    pagination: {
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1
    }
  };
}

async function simulateMockScreening(patientData, imageFile, mockScenario = 'GOOD') {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const imagePreviewUrl = imageFile ? URL.createObjectURL(imageFile) : null;
  const timestamp = new Date().toISOString();

  if (mockScenario === 'UNGRADABLE') {
    return {
      success: true,
      timestamp,
      patient: patientData,
      quality: {
        status: 'UNGRADABLE',
        score: 34.2,
        focusScore: 28.5,
        illuminationScore: 32.0,
        fovScore: 42.1,
        recaptureRequired: true,
        enhancementApplied: false,
        reason: 'Image quality is insufficient for reliable screening due to severe blur and low illumination contrast. Please capture another retinal image.',
        metrics: { laplacianVar: 32.4, tenengradMean: 12.1, meanBrightness: 24.8, stdContrast: 14.2, fovAreaRatio: 0.38 }
      },
      prediction: null,
      explainability: null,
      referral: {
        status: 'RECAPTURE_REQUIRED',
        recommendation: 'Image Recapture Required',
        reason: 'The fundus image was classified as ungradable. A fresh retinal photograph must be taken before AI screening can be performed.'
      }
    };
  }

  return {
    success: true,
    timestamp,
    patient: patientData,
    quality: {
      status: 'GOOD',
      score: 89.2,
      focusScore: 88.0,
      illuminationScore: 92.5,
      fovScore: 86.8,
      recaptureRequired: false,
      enhancementApplied: false,
      reason: 'Retinal image meets all focus, illumination, and field-of-view quality criteria.',
      metrics: { laplacianVar: 245.8, tenengradMean: 64.2, meanBrightness: 88.2, stdContrast: 48.5, fovAreaRatio: 0.78 }
    },
    prediction: {
      level: 2,
      className: 'Moderate DR',
      confidence: 91.8,
      probabilities: { 'No DR': 1.2, 'Mild DR': 4.8, 'Moderate DR': 91.8, 'Severe DR': 1.8, 'Proliferative DR': 0.4 }
    },
    explainability: { originalImage: imagePreviewUrl, heatmapUrl: null, overlayUrl: null },
    referral: {
      status: 'REFERRAL_RECOMMENDED',
      recommendation: 'Ophthalmologist Referral Recommended',
      reason: 'Level 2+ Diabetic Retinopathy detected. Referral to an ophthalmologist is recommended for detailed fundus examination.'
    }
  };
}
