# Dristi AI — REST API Documentation (SIH26038)

This document provides complete specification for the REST API endpoints exposed by the **Dristi AI** backend service (`http://localhost:5000/api`).

---

## Base URL & Environment

- **Development Base URL**: `http://localhost:5000/api`
- **Content Types**:
  - `multipart/form-data` for screening submissions (includes image file)
  - `application/json` for standard GET endpoints and responses

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/screenings` | Process fundus photograph through Python AI pipeline & save screening record | Public |
| `GET` | `/api/screenings` | Retrieve paginated list of historical patient screening records | Public |
| `GET` | `/api/screenings/:id` | Retrieve detailed screening dossier for a single record by Mongo ID | Public |
| `GET` | `/api/health` | System health check reporting service & MongoDB Atlas connectivity | Public |

---

## 2. Detailed Endpoint Specs

### A. `POST /api/screenings`

Submit patient demographic data and a retinal fundus photograph. Triggers Image Quality Assessment (IQA), EfficientNet-B0 DR severity classification, PyTorch Grad-CAM heatmap generation, and persists the resulting record to MongoDB Atlas.

#### Request Headers
`Content-Type: multipart/form-data`

#### Request Parameters (Form Data)

| Field Name | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `fundusImage` | `File` | **Yes** | Retinal fundus photograph (PNG, JPG, JPEG; max 15MB) | `retina.png` |
| `patientId` | `String` | **Yes** | Patient identifier string | `PAT-2026-8910` |
| `age` | `Number` | No | Patient age in years (1 - 120) | `54` |
| `sex` | `String` | No | `Female`, `Male`, `Other`, or `Unknown` | `Female` |
| `location` | `String` | No | Screening facility / PHC location name | `PHC Rampur` |
| `diabetesDuration` | `Number` | No | Duration of diagnosed diabetes in years | `8` |

#### Success Response (`201 Created`)

```json
{
  "success": true,
  "message": "Screening processed and persisted successfully",
  "recordId": "66e850b1f8c12a34b5e67890",
  "data": {
    "_id": "66e850b1f8c12a34b5e67890",
    "patientId": "PAT-2026-8910",
    "patientAge": 54,
    "patientSex": "Female",
    "location": "PHC Rampur",
    "diabetesDuration": 8,
    "screeningDate": "2026-09-16T21:30:00.000Z",
    "imageQuality": {
      "status": "GOOD",
      "score": 78.1,
      "focusScore": 45.25,
      "illuminationScore": 100.0,
      "fovScore": 100.0,
      "metrics": {
        "laplacian_var": 135.76,
        "tenengrad_mean": 40.08,
        "mean_brightness": 47.46,
        "std_contrast": 30.44,
        "fov_area_ratio": 0.7407
      },
      "reason": "Image meets all sharpness, illumination, and FOV criteria.",
      "enhancementApplied": false,
      "recaptureRequired": false
    },
    "predictedLevel": 1,
    "predictedClass": "Mild DR",
    "confidence": 90.74,
    "probabilities": {
      "No DR": 0.0,
      "Mild DR": 90.74,
      "Moderate DR": 0.0,
      "Severe DR": 0.0,
      "Proliferative DR": 9.25
    },
    "referralStatus": "ROUTINE",
    "referralReason": "Low Risk: Detected Mild DR (Level 1). Routine annual follow-up screening recommended.",
    "imagePath": "/uploads/fundus-1726500000000.png",
    "heatmapPath": "/reports/gradcam/0369f3efe69b_heatmap.png",
    "overlayPath": "/reports/gradcam/0369f3efe69b_overlay.png",
    "processingStatus": "COMPLETED",
    "modelVersion": "EfficientNet-B0 v1.0 (SIH26038 Baseline)",
    "createdAt": "2026-09-16T21:30:00.000Z",
    "updatedAt": "2026-09-16T21:30:00.000Z"
  }
}
```

---

### B. `GET /api/screenings`

Retrieve paginated screening records sorted in reverse chronological order.

#### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :---: | :--- |
| `page` | `Number` | `1` | Page number |
| `limit` | `Number` | `10` | Records per page |
| `search` | `String` | `""` | Optional patient ID search term |

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "data": [
    {
      "_id": "66e850b1f8c12a34b5e67890",
      "patientId": "PAT-2026-8910",
      "patientAge": 54,
      "patientSex": "Female",
      "location": "PHC Rampur",
      "diabetesDuration": 8,
      "screeningDate": "2026-09-16T21:30:00.000Z",
      "imageQuality": { "status": "GOOD", "score": 78.1 },
      "predictedLevel": 1,
      "predictedClass": "Mild DR",
      "confidence": 90.74,
      "referralStatus": "ROUTINE"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### C. `GET /api/screenings/:id`

Retrieve full screening dossier by Mongo ObjectID.

#### Success Response (`200 OK`)
Returns single screening object inside `data`.

#### Error Response (`404 Not Found`)
```json
{
  "success": false,
  "message": "Screening record with ID '66e850b1f8c12a34b5e67899' not found"
}
```

---

### D. `GET /api/health`

Returns operational status of the service and MongoDB Atlas connectivity.

#### Success Response (`200 OK`)

```json
{
  "status": "UP",
  "service": "Dristi AI Backend",
  "database": "CONNECTED",
  "timestamp": "2026-09-16T21:30:00.000Z"
}
```

---

## 3. Status Code Summary

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created & persisted.
- `400 Bad Request`: Payload validation failed or invalid ObjectID format.
- `404 Not Found`: Endpoint or resource ID not found.
- `500 Internal Server Error`: Unhandled backend runtime error.
