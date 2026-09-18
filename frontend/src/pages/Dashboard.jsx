import React, { useState } from 'react';
import Header from '../components/Header';
import PatientForm from '../components/PatientForm';
import ImageUploader from '../components/ImageUploader';
import ImagePreview from '../components/ImagePreview';
import ScreeningProgress from '../components/ScreeningProgress';
import ErrorMessage from '../components/ErrorMessage';
import ScreeningReport from '../components/ScreeningReport';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import ScreeningHistory from './ScreeningHistory';
import { submitScreening } from '../services/api';
import { Play, Sparkles, RefreshCcw, HelpCircle, X, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history'

  const [patientData, setPatientData] = useState({
    patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    age: '54',
    sex: 'Female',
    location: 'PHC Rampur',
    diabetesDuration: '8'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [mockScenario, setMockScenario] = useState('GOOD');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState('upload');
  const [screeningResult, setScreeningResult] = useState(null);
  const [error, setError] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Handle Image Selection
  const handleImageSelect = (file) => {
    setImageFile(file);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setScreeningResult(null);
    setCurrentStage('upload');
    setError(null);
  };

  // Form Validation
  const validateInputs = () => {
    if (!patientData.patientId || !patientData.patientId.trim()) {
      setError('Please enter a valid Patient ID.');
      return false;
    }
    if (!patientData.age || isNaN(patientData.age) || Number(patientData.age) <= 0) {
      setError('Please enter a valid patient age.');
      return false;
    }
    if (!imageFile) {
      setError('Please upload a retinal fundus image before starting screening.');
      return false;
    }
    return true;
  };

  // Execute Screening Workflow
  const handleStartScreening = async (e) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (!validateInputs()) return;

    setIsProcessing(true);
    setError(null);
    setScreeningResult(null);

    try {
      // Step 1: Quality Check
      setCurrentStage('quality');
      await new Promise((r) => setTimeout(r, 400));

      // Step 2: Preprocess
      setCurrentStage('preprocess');
      await new Promise((r) => setTimeout(r, 400));

      // Step 3: Classification
      setCurrentStage('classify');
      await new Promise((r) => setTimeout(r, 400));

      // Step 4: Explainability
      setCurrentStage('explain');
      await new Promise((r) => setTimeout(r, 300));

      // Step 5: Referral Support
      setCurrentStage('referral');

      // Call API Service
      const result = await submitScreening(patientData, imageFile, mockScenario);
      setScreeningResult(result);
    } catch (err) {
      setError(err.message || 'Unable to process screening request. Please try again.');
      setCurrentStage('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewScreening = () => {
    setPatientData({
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      age: '54',
      sex: 'Female',
      location: 'PHC Rampur',
      diabetesDuration: '8'
    });
    handleRemoveImage();
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mockScenario={mockScenario}
        onMockScenarioChange={setMockScenario}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'history' ? (
          <ScreeningHistory onNavigateBack={() => setActiveTab('dashboard')} />
        ) : (
          <>
            {/* Hero Welcome Banner */}
            <div className="hero-banner">
              <h1 className="hero-title">AI-Assisted Diabetic Retinopathy Screening</h1>
              <p className="hero-description">
                A fast, automated decision-support pipeline for rural healthcare workers. Upload a fundus photograph to assess image quality, DR severity, and referral guidance.
              </p>
            </div>

            {/* Global Error Banner */}
            <ErrorMessage message={error} onRetry={handleStartScreening} />

            {/* Active Pipeline Progress Timeline */}
            <ScreeningProgress currentStage={currentStage} isProcessing={isProcessing} />

            {/* If Screening Result Exists: Show Full Dossier */}
            {screeningResult ? (
              <div style={{ marginTop: '2rem' }}>
                <ScreeningReport
                  result={screeningResult}
                  originalImagePreview={imagePreviewUrl}
                  onStartNew={handleStartNewScreening}
                />
              </div>
            ) : (
              /* Main 2-Column Upload & Demographic Entry Grid */
              <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
                {/* Left Column: Patient Info */}
                <PatientForm
                  formData={patientData}
                  onChange={setPatientData}
                  disabled={isProcessing}
                />

                {/* Right Column: Retinal Image Upload */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h2 className="card-title">Retinal Image Capture</h2>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Select or drag fundus photograph for AI analysis</span>
                    </div>
                  </div>

                  {!imageFile ? (
                    <ImageUploader
                      onImageSelect={handleImageSelect}
                      disabled={isProcessing}
                      error={error}
                      setError={setError}
                    />
                  ) : (
                    <ImagePreview
                      imageFile={imageFile}
                      imagePreviewUrl={imagePreviewUrl}
                      onChangeImage={() => setImageFile(null)}
                      onRemoveImage={handleRemoveImage}
                      disabled={isProcessing}
                    />
                  )}

                  {/* Start Screening Action */}
                  <div className="actions-section">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={handleStartScreening}
                      disabled={isProcessing || !imageFile}
                    >
                      <Play size={20} />
                      <span>{isProcessing ? 'Screening Pipeline Processing...' : 'Start Screening Pipeline'}</span>
                    </button>
                    <span className="action-hint">
                      Executes Image Quality Assessment $\rightarrow$ Preprocessing $\rightarrow$ EfficientNet-B0 DR Model $\rightarrow$ Grad-CAM Explainability.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Medical Disclaimer Footer */}
            <div style={{ marginTop: '3rem' }}>
              <MedicalDisclaimer />
            </div>
          </>
        )}
      </main>

      {/* Health Worker Guide Modal */}
      {isHelpOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Health Worker Screening Operating Guide</h2>
              <button onClick={() => setIsHelpOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p><strong>1. Enter Patient Details:</strong> Fill in Patient ID, Age, and Sex in the demographic panel.</p>
              <p><strong>2. Upload Retinal Fundus Photograph:</strong> Select a sharp, well-lit PNG/JPG fundus photograph from your device.</p>
              <p><strong>3. Run AI Screening Pipeline:</strong> Click <em>Start Screening Pipeline</em> to trigger automated quality checks and DR evaluation.</p>
              <p><strong>4. Review Image Quality & Predictions:</strong>
                <br />• If quality is <strong>UNGRADABLE</strong>, capture a new photograph.
                <br />• If DR Level is <strong>Level 2+ (Moderate, Severe, Proliferative)</strong>, follow referral guidance.
              </p>
              <p><strong>5. Screening History Tab:</strong> Click <em>Screening History</em> in the top header bar to browse all past patient evaluations stored in the database.</p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setIsHelpOpen(false)}>
                Got it, close guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global App Footer */}
      <footer className="app-footer">
        <div>Dristi AI • Explainable AI for Diabetic Retinopathy Screening in Rural India</div>
      </footer>
    </div>
  );
}
