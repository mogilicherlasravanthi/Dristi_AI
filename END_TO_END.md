# Dristi AI — End-to-End System Documentation & Verification Report (SIH26038)

**Project Name**: Dristi AI — Explainable AI for Diabetic Retinopathy Screening in Rural India  
**Problem Statement ID**: SIH26038  

---

## 1. System Architecture Overview

Dristi AI connects a React frontend dashboard, Node.js + Express backend service, Python PyTorch AI inference pipeline, and MongoDB Atlas database into an end-to-end medical decision-support workflow:

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend Dashboard                   │
│        (Vite Dev Server @ http://localhost:3000)        │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ HTTP POST /api/screenings (Multipart FormData)
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js + Express Backend                 │
│         (Express Server @ http://localhost:5000)        │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
  1. Spawns    │                           │ 2. Persists
     Python    ▼                           ▼    Screening Dossier
┌──────────────────────────┐    ┌──────────────────────────┐
│   Python AI Pipeline     │    │   MongoDB Atlas Cloud    │
│  (ml/inference.py CLI)   │    │    Database Persistence  │
└──────────────┬───────────┘    └──────────────────────────┘
               │
               ├── Image Quality Assessment (ml/image_quality.py)
               ├── LAB CLAHE Enhancement (for Borderline Images)
               ├── EfficientNet-B0 DR Classification (Level 0-4)
               ├── Grad-CAM Heatmap Generation (ml/gradcam.py)
               └── Clinical Referral Support Logic (Level 2+ Threshold)
```

---

## 2. Directory Structure

```
dristi-ai/
├── API.md                              # Complete REST API Specification
├── END_TO_END.md                       # Architecture & System Verification Report
├── backend/
│   ├── .env                            # Environment Configuration (MONGODB_URI, PORT)
│   ├── uploads/                        # Uploaded fundus photograph storage
│   └── src/
│       ├── app.js                      # Express App Configuration
│       ├── server.js                   # Server Listener & Database Initializer
│       ├── config/db.js                # MongoDB Atlas Connection Setup
│       ├── controllers/
│       │   ├── screening.controller.js # Screening REST Handlers
│       │   └── health.controller.js    # System Health Handler
│       ├── middleware/                 # Error & 404 Handlers
│       ├── models/
│       │   └── screening.model.js      # Mongoose Screening Dossier Schema
│       ├── routes/                     # API Route Definitions
│       └── services/
│           ├── aiInference.service.js  # Node.js Subprocess IPC to ml/inference.py
│           └── screening.service.js    # Data Access Layer with Offline Fallback
├── frontend/
│   ├── src/
│   │   ├── components/                 # UI Component Layer
│   │   ├── pages/                      # Dashboard & ScreeningHistory Pages
│   │   └── services/api.js             # API Service Abstraction
├── ml/
│   ├── gradcam.py                      # PyTorch Grad-CAM Hook Module
│   ├── image_quality.py                # Image Quality Assessment & CLAHE Module
│   ├── inference.py                    # Unified AI Inference Master Script
│   ├── train.py                        # EfficientNet-B0 Baseline Training Script
│   ├── evaluate.py                     # Baseline Model Evaluator
│   ├── models/
│   │   └── dristi_efficientnet_b0_baseline.pth # Trained Model Checkpoint
│   └── reports/
│       ├── EXPERIMENT_001.md           # Baseline Model Performance Report
│       ├── gradcam/                    # Output Heatmaps & Overlays
│       └── image_quality/              # Quality Assessment Visual Reports
```

---

## 3. Setup & Startup Commands

### Prerequisites
- Node.js (v18+)
- Python 3.10+ with `torch`, `torchvision`, `PIL`, `cv2`, `matplotlib`, `numpy`, `pandas`, `scikit-learn` installed

### Environment Configuration (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://lohithkumarbasettii_db_user:Lohith2605@cluster0.awgawsc.mongodb.net/dristi_ai?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
```

### Running the System

1. **Start Backend Express Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *Backend listener runs at `http://localhost:5000`.*

2. **Start Frontend Dashboard**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend dashboard opens at `http://localhost:3000`.*

---

## 4. End-to-End Demo Procedure

1. Open `http://localhost:3000` in your web browser.
2. In the **Patient Information Form**, keep or update patient demographics (Patient ID, Age, Sex, Location, Diabetes Duration).
3. In the **Retinal Image Capture** card, drag or upload a fundus photograph (e.g. `dataset/prepared/test/Mild/0369f3efe69b.png`).
4. Click **Start Screening Pipeline**.
5. Observe automated workflow stages:
   - **Quality Check**: Focus, Illumination, and FOV scores.
   - **Classification**: 5-class DR probabilities & predicted severity level.
   - **Grad-CAM Explainability**: Interactive toggle between original image and Jet heatmap overlay.
   - **Referral Guidance**: Level 2+ referral recommendations and medical decision-support disclaimers.
6. Click **Screening History** tab in header to verify the record was saved and persists in MongoDB Atlas.

---

## 5. Final Acceptance Verification Checklist

| Requirement / Module | Verification Test | Status |
| :--- | :--- | :---: |
| **EfficientNet-B0 Model** | Evaluated on 550 test images: 96.0% overall accuracy, 98.21% referable sensitivity, 97.86% specificity | **PASS** |
| **Image Quality Assessment** | Evaluates Laplacian focus, green-channel illumination, Otsu FOV area; applies LAB CLAHE enhancement on borderline images | **PASS** |
| **Grad-CAM Explainability** | Computes forward/backward hooks on `model.features[-1]`, outputting Jet heatmaps and blended overlays | **PASS** |
| **Unified Python Inference** | `python ml/inference.py` executes pipeline end-to-end and outputs validated JSON to stdout | **PASS** |
| **Node.js Subprocess IPC** | `aiInference.service.js` spawns Python process, parses output JSON, and formats HTTP URLs | **PASS** |
| **MongoDB Atlas Persistence** | Screening dossiers successfully stored with Mongoose schemas and compound indexes | **PASS** |
| **React Frontend Interface** | Vite React app renders pipeline progress, quality metrics, DR severity, probabilities chart, Grad-CAM viewer, and screening history | **PASS** |
| **Medical Disclaimers** | Prominently displays AI decision-support disclaimers across UI components and reports | **PASS** |
