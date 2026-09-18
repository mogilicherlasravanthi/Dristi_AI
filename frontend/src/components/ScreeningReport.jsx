import React from 'react';
import { Printer, RotateCcw, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import QualityResult from './QualityResult';
import DRResult from './DRResult';
import ReferralCard from './ReferralCard';
import GradCAMViewer from './GradCAMViewer';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function ScreeningReport({ result, originalImagePreview, onStartNew }) {
  if (!result) return null;

  const { patient, timestamp, quality, prediction, referral } = result;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Printable Report Header */}
      <div className="card" style={{ borderTop: '4px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FileText size={16} />
              <span>Dristi AI Screening Summary Report</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
              Patient Screening Dossier
            </h1>
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Screening Timestamp: {timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Download PDF</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={onStartNew}>
              <RotateCcw size={16} />
              <span>Start New Screening</span>
            </button>
          </div>
        </div>

        {/* Patient Demographic Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Patient ID</span>
            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{patient?.patientId || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Age / Sex</span>
            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{patient?.age || 'N/A'} Yrs • {patient?.sex || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Location</span>
            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{patient?.location || 'PHC Primary Care'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Diabetes Duration</span>
            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{patient?.diabetesDuration ? `${patient.diabetesDuration} Years` : 'Not Specified'}</strong>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* 1. Image Quality Assessment Section */}
      <QualityResult quality={quality} />

      {/* 2 & 3. DR Prediction & Referral Support (Only if quality is not UNGRADABLE) */}
      {quality?.status !== 'UNGRADABLE' && prediction ? (
        <>
          <DRResult prediction={prediction} />
          <ReferralCard referral={referral} qualityStatus={quality?.status} confidence={prediction?.confidence} />
          <GradCAMViewer
            originalImage={originalImagePreview}
            heatmapUrl={result?.explainability?.heatmapUrl}
            overlayUrl={result?.explainability?.overlayUrl}
            predictedClass={prediction?.className}
          />
        </>
      ) : (
        <ReferralCard referral={referral} qualityStatus={quality?.status} confidence={0} />
      )}

      {/* Bottom Action Footer */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={16} />
          <span>Print Summary Report</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={onStartNew}>
          <RotateCcw size={16} />
          <span>Screen Another Patient</span>
        </button>
      </div>
    </div>
  );
}
