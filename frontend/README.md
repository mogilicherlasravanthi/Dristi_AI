# Dristi AI — Frontend Web Application

**SIH Problem Statement:** SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India

This directory contains the user interface for the **Dristi AI** web application, designed specifically for healthcare workers operating in rural screening centers and health camps across India.

---

## 🚀 Technology Choice: React.js + Vite

- **React.js**: Selected for its component-driven architecture, efficient state management, reusability, and strong ecosystem suited for responsive healthcare web interfaces.
- **Vite**: Modern build tool providing instantaneous server start, fast HMR (Hot Module Replacement), and lightweight production bundling.
- **Vanilla CSS**: Clean, custom design system engineered for maximum performance, crisp typography, accessible contrast, and zero external CSS overhead.

---

## 📁 Component & Directory Structure

```
frontend/
│
├── public/                # Static assets (favicons, public images)
│   └── vite.svg
│
├── src/
│   ├── assets/            # Project static assets & media
│   ├── components/
│   │   └── ImageUpload.jsx  # Retinal image selection, drag-and-drop, preview & reset
│   │
│   ├── pages/
│   │   └── Dashboard.jsx    # Primary screening interface with patient form & actions
│   │
│   ├── services/          # API service stubs reserved for future backend communication
│   │   └── api.js
│   │
│   ├── App.jsx            # Application layout root wrapper
│   ├── main.jsx           # React DOM entry point
│   └── index.css          # Global healthcare design system & responsive layout styles
│
├── .gitignore             # Standard node_modules & build output ignores
├── index.html             # HTML entry point with metadata & Google Fonts
├── package.json           # Dependencies & scripts
├── vite.config.js         # Vite configuration
└── README.md              # Frontend documentation
```

---

## 💡 Component Functionality

### 1. `Dashboard.jsx` (Main Screening Page)
- Displays Dristi AI branding and problem statement overview.
- Collects minimal patient information (`Patient ID`, `Full Name`, `Age`, `Gender`, `Eye Examined`, `Notes`).
- Embeds the `ImageUpload` component.
- Houses the primary **"Analyze Image"** call-to-action button.
- Displays a visual workflow pipeline detailing the 7 screening stages.

### 2. `ImageUpload.jsx` (Image Selection & Preview)
- Provides drag-and-drop zone as well as file browser dialog for selecting retinal fundus images (`.jpg`, `.jpeg`, `.png`).
- Displays a instant local browser preview using `URL.createObjectURL`.
- Displays file details (file name, file size).
- Provides controls to change or remove the selected image.

---

## ⚡ Current Functionality Status

- **Fully Functional Local UI**: Patient information form, drag-and-drop file upload, image preview, image replacement, and responsive layout.
- **Pure Local State**: All data and images remain strictly local in the user's browser.
- **No Mock Results**: The "Analyze Image" button is disabled until required fields are filled and displays a setup notice when clicked.

---

## 🔮 Future Integration Roadmap

In future development phases:
1. **Backend API (`services/api.js`)**: Will handle sending retinal fundus images and patient metadata to the Node.js/Express backend API.
2. **AI Preprocessing & Inference**: Images will be processed by the PyTorch CNN/ResNet model.
3. **Grad-CAM Explanations**: Heatmaps highlighting lesions/hemorrhages will be rendered alongside DR severity grade predictions.
4. **Database Storage**: Patient screening records and referral reports will be persisted in MongoDB.

---

## 🛠️ Development & Running Instructions

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```
