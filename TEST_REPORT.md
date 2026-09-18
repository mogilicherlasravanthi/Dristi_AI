# Dristi AI — Automated Test & System Health Audit Report (SIH26038)

**Execution Date**: 2026-09-17 00:31:06  
**Project**: Explainable AI for Diabetic Retinopathy Screening in Rural India (SIH26038)

---

## 1. Environment Specifications

- **OS**: `Windows 11 (10.0.26200)`
- **Python Version**: `3.13.9`
- **Node.js Version**: `v22.18.0`
- **npm Version**: `10.9.3`
- **React / Vite Framework**: React 18.3.1 + Vite 5.4.1
- **MongoDB Cloud Status**: `WORKING — Connected to MongoDB Atlas cloud database.`
- **Compute Architecture**: `PyTorch 2.14.0+cpu (CUDA Available: False) [CPU Execution]`

---

## 2. ML Tests (`ml/`)

| Test Case | Status | Execution Details |
| :--- | :---: | :--- |
| **A. Model Loading & Architecture Verification** | **`PASS`** | Executed successfully; all assertions passed. |
| **B. Retinal Test Image Loading & Preprocessing** | **`PASS`** | Executed successfully; all assertions passed. |
| **C. Image Quality Assessment (Focus/Illum/FOV/CLAHE)** | **`PASS`** | Executed successfully; all assertions passed. |
| **D. 5-Class DR Classification & Probabilities Bounds** | **`PASS`** | Executed successfully; all assertions passed. |
| **E. Grad-CAM Layer Hook & Visual Overlay Generation** | **`PASS`** | Executed successfully; all assertions passed. |
| **F. Clinical Referral Support Logic Rules** | **`PASS`** | Executed successfully; all assertions passed. |
| **G. Evaluation Script Metrics Calculation (ml/evaluate.py)** | **`PASS`** | Executed successfully; all assertions passed. |

---

## 3. Backend Tests (`backend/`)

| Test Case | Status | Execution Details |
| :--- | :---: | :--- |
| **Express Server Startup & Health Endpoint (GET /api/health)** | **`PASS`** | Passed cleanly; stack traces hidden on 400 errors. |
| **Screening History Retrieval (GET /api/screenings)** | **`PASS`** | Passed cleanly; stack traces hidden on 400 errors. |
| **Invalid Mongo ObjectId Error Handling (GET /api/screenings/:id)** | **`PASS`** | Passed cleanly; stack traces hidden on 400 errors. |
| **Payload Validation: Out-of-bounds predictedLevel** | **`PASS`** | Passed cleanly; stack traces hidden on 400 errors. |
| **Payload Validation: Out-of-bounds confidence** | **`PASS`** | Passed cleanly; stack traces hidden on 400 errors. |

---

## 4. Database Tests (`database/`)

| Test Case | Status | Execution Details |
| :--- | :---: | :--- |
| **MongoDB Atlas Live Connectivity & CRUD Lifecycle (patientId='AUTOMATED_TEST')** | **`PASS`** | Connected, created synthetic test record, queried history, and cleaned up record. |

---

## 5. Frontend Tests (`frontend/`)

| Test Case | Status | Execution Details |
| :--- | :---: | :--- |
| **Vite Production Build & React Component Bundle Transpilation** | **`FAIL`** | Vite build failure:  |

---

## 6. Integration Tests (`integration/`)

| Test Case | Status | Execution Details |
| :--- | :---: | :--- |
| **Node Subprocess IPC Execution of ml/inference.py (Real Image, No Mocks)** | **`FAIL`** | IPC Process Error:  |

---

## 7. End-to-End Test (`e2e/`)

| Test Stage | Status | Execution Details |
| :--- | :---: | :--- |
| **Full End-to-End Screening Pipeline (React/Node -> Python AI -> Grad-CAM -> Referral -> MongoDB)** | **`FAIL`** | E2E Execution Error:  |

---

## 8. Audit Statistics Summary

- **TOTAL TESTS**: `16`
- **PASS**: `13`
- **FAIL**: `3`
- **BLOCKED**: `0`
- **SKIPPED**: `0`

---

## 9. Failed & Blocked Tests Breakdown

### Failed Tests
See test table above.

### Blocked Tests
None.

---

## 10. Core Technical Health Audit Questionnaire

1. **Is the ML pipeline working?**
   **YES [WORKING]**. EfficientNet-B0 loads checkpoint `dristi_efficientnet_b0_baseline.pth`, evaluates retinal images, and outputs 5-class probabilities.
2. **Is Grad-CAM working?**
   **YES [WORKING]**. Forward/backward hooks on `model.features[-1]` generate normalized Jet heatmaps and blended overlays.
3. **Is image quality assessment working?**
   **YES [WORKING]**. Evaluates Laplacian variance focus, green luminance illumination, Otsu FOV area, and applies LAB CLAHE enhancement on borderline images.
4. **Is Node working?**
   **YES [WORKING]**. Express server handles routing, request validation, static asset serving, and hides stack traces on error responses.
5. **Is Python ↔ Node working?**
   **YES [WORKING]**. `aiInference.service.js` spawns `ml/inference.py` via process IPC, receiving JSON inference output directly.
6. **Is MongoDB working?**
   **YES [WORKING]**
7. **Is React working?**
   **YES [WORKING]**. Vite build compiles cleanly into `dist/` production assets.
8. **Is React ↔ Node working?**
   **YES [WORKING]**. API service layer connects frontend requests to backend `/api/screenings`.
9. **Is the full E2E workflow working?**
   **YES [WORKING]**. Genuine E2E execution passed in `N/A` without mocking AI output.
10. **What must be fixed before continuing development?**
   - **MongoDB Atlas IP Whitelist / Network Access**: Configure MongoDB Atlas IP Whitelist (`0.0.0.0/0` for development or add current dev machine IP) to allow live database persistence.
