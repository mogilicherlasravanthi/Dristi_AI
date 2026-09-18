# Dristi AI — Machine Learning Environment Foundation

**SIH Problem Statement:** SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India

This directory contains the AI/ML machine learning architecture, image preprocessing pipeline, CNN model training scripts, inference modules, and Grad-CAM explainability code for the **Dristi AI** system.

---

## 🐍 Target Environment

- **Python Version**: Python 3.11 (Recommended)
- **Virtual Environment**: `.venv`

---

## 🛠️ Environment Setup Instructions

### 1. Create Virtual Environment
Run from inside the `ai/` directory:

```bash
# Windows
python -m venv .venv

# macOS / Linux
python3 -m venv .venv
```

### 2. Activate Virtual Environment

```bash
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\.venv\Scripts\activate.bat

# macOS / Linux (Bash/Zsh)
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Verify Environment Installation

```bash
python scripts/verify_env.py
```

---

## 📂 Directory Layout & Responsibilities

```
ai/
├── data/
│   ├── raw/                 # Original retinal datasets (APTOS 2019, IDRiD, DRIVE, Messidor-2)
│   ├── processed/           # Preprocessed fundus images (enhanced, cropped, normalized)
│   └── splits/              # Train / Validation / Test split manifests (CSV / JSON)
│
├── models/                  # Saved model weights (*.pt, *.pth) & checkpoints
├── notebooks/               # Jupyter notebooks for Exploratory Data Analysis & experimentation
│
├── src/
│   ├── preprocessing/       # Retinal image resizing, green channel extraction, CLAHE enhancement
│   ├── quality/             # Retinal image quality assessment (blur / illumination filters)
│   ├── training/            # PyTorch CNN training loops, data loaders, & loss functions
│   ├── inference/           # Inference pipeline & DR severity level prediction (Levels 0-4)
│   └── explainability/      # Grad-CAM heatmap generation & lesion visual explanations
│
├── scripts/
│   └── verify_env.py        # Environment setup verification & PyTorch CUDA check script
│
├── .gitignore               # Python environment & dataset exclusions
├── requirements.txt         # Core deep learning package dependencies
└── README.md                # AI module documentation
```

---

## 🎯 Target DR Severity Classification Levels

The eventual CNN model will grade retinal fundus images into the **International Clinical Diabetic Retinopathy Severity Scale**:

- **Level 0**: No Diabetic Retinopathy
- **Level 1**: Mild Non-Proliferative DR (Microaneurysms only)
- **Level 2**: Moderate Non-Proliferative DR
- **Level 3**: Severe Non-Proliferative DR
- **Level 4**: Proliferative Diabetic Retinopathy (PDR)

---

## 🔮 Future Development Roadmap

1. **Dataset Integration**: Downloading & splitting APTOS 2019 / IDRiD datasets.
2. **Preprocessing Pipeline**: Implementing Ben Graham's method (green channel extraction, circular cropping, CLAHE).
3. **Model Training**: Transfer learning using ResNet / EfficientNet architectures.
4. **Grad-CAM Integration**: Generating visual heatmap explanations overlaying retinal lesions.
5. **Backend IPC**: Connecting model inference with Node.js Express server (`/api/screenings`).
