# Dristi AI — Backend Service Foundation

**SIH Problem Statement:** SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India

This directory contains the Node.js + Express.js backend application service for **Dristi AI**. The backend acts as the coordination and API layer connecting the React frontend, Python AI inference pipeline, database storage, and screening workflow.

---

## 🛠️ Technology Stack

- **Node.js**: Asynchronous JavaScript runtime environment.
- **Express.js**: Fast, unopinionated web framework for API routing and middleware management.
- **dotenv**: Zero-dependency module for environment variable configuration.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing with the React frontend.
- **nodemon**: Development tool for automatic server reloads.

---

## 📂 Architecture & Directory Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── health.controller.js     # GET /api/health controller
│   │   └── screening.controller.js  # Stub for future POST /api/screenings
│   │
│   ├── middleware/
│   │   ├── error.middleware.js      # Centralized API error handling
│   │   └── notFound.middleware.js   # 404 Unknown Route JSON handler
│   │
│   ├── routes/
│   │   ├── health.routes.js         # Health check routes
│   │   ├── screening.routes.js      # Screening route stubs
│   │   └── index.js                 # Primary API router aggregator
│   │
│   ├── services/
│   │   ├── aiInference.service.js   # Stub for future Python AI communication
│   │   └── screening.service.js     # Stub for screening business logic & DB
│   │
│   ├── app.js                       # Express app configuration & middleware
│   └── server.js                    # HTTP server entry point & environment setup
│
├── .env                             # Local environment variables (git-ignored)
├── .env.example                     # Environment template file
├── .gitignore                       # Node.js git ignore configuration
├── package.json                     # Backend manifest & dependencies
└── README.md                        # Backend documentation
```

---

## ⚡ API Endpoints

### Health Check
- **`GET /api/health`**: Returns system operational status, service name, version, and ISO timestamp.
  ```json
  {
    "status": "ok",
    "service": "Dristi AI Backend",
    "version": "1.0.0",
    "timestamp": "2026-09-15T20:30:00.000Z"
  }
  ```

---

## ⚙️ Environment Configuration

Create a local `.env` file based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Running the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development mode with Nodemon
npm run dev

# Start production server
npm start
```

Default port: **`5000`**

---

## 🔮 Future Integration Roadmap

- **Python AI Service**: Integration with PyTorch CNN models for automated Diabetic Retinopathy severity grading.
- **Grad-CAM Explanations**: Heatmap generation highlighting retinal lesions and hemorrhages.
- **MongoDB Database**: Persistent storage for patient screening histories and clinical reports.
- **Referral Workflow Engine**: Automated referral recommendations for eye care specialists based on screening output.
