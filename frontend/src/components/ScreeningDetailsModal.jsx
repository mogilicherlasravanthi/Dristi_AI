import React from 'react';
import { X, Calendar, User, Eye, Stethoscope, Sliders, Cpu, ShieldAlert, Printer } from 'lucide-react';
import ProbabilityChart from './ProbabilityChart';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function ScreeningDetailsModal({ record, onClose }) {
  if (!record) return null;

  const {
    patientId,
    patientAge,
    patientSex,
    location,
    diabetesDuration,
    createdAt,
    screeningDate,
    imageQuality,
    predictedLevel = 0,
    predictedClass = 'No DR',
    confidence = 0,
    probabilities = {},
    referralStatus,
    referralReason,
    modelVersion
  } = record;

  const dateStr = new Date(createdAt || screeningDate || Date.now()).toLocaleString();

  const isGood = imageQuality?.status === 'GOOD';
  const isBorderline = imageQuality?.status === 'BORDERLINE';
  const isUngradable = imageQuality?.status === 'UNGRADABLE';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Eye size={16} />
              <span>Historical Screening Dossier</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
              Patient ID: {patientId}
            </h2>
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>Screening Timestamp: {dateStr}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        <MedicalDisclaimer />

        {/* Patient Demographics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Age / Sex</span>
            <strong style={{ color: '#0f172a' }}>{patientAge || 'N/A'} Yrs • {patientSex || 'Female'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Location</span>
            <strong style={{ color: '#0f172a' }}>{location || 'PHC Primary Care'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Diabetes Duration</span>
            <strong style={{ color: '#0f172a' }}>{diabetesDuration ? `${diabetesDuration} Yrs` : 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Model Version</span>
            <strong style={{ color: '#0f172a', fontSize: '0.75rem' }}>{modelVersion || 'EfficientNet-B0 v1.0'}</strong>
          </div>
        </div>

        {/* Image Quality Summary */}
        <div style={{ backgroundColor: isGood ? '#f0fdf4' : isBorderline ? '#fffbebf' : '#fef2f2', border: `1px solid ${isGood ? '#bbf7d0' : isBorderline ? '#fde68a' : '#fca5a5'}`, borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isGood ? '#16a34a' : isBorderline ? '#d97706' : '#dc2626' }}>
              Image Quality: {imageQuality?.status || 'GOOD'} ({imageQuality?.score || 85}/100)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Focus: {imageQuality?.focusScore || 80} | Illum: {imageQuality?.illuminationScore || 90} | FOV: {imageQuality?.fovScore || 85}
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, fontStyle: 'italic' }}>
            {imageQuality?.reason || 'Retinal image meets quality criteria.'}
          </p>
        </div>

        {/* DR Severity Prediction */}
        {!isUngradable && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>DR Severity Level</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.1rem 0' }}>
                  Level {predictedLevel} — {predictedClass}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Confidence</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>{confidence.toFixed(1)}%</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                5-Class Probability Distribution
              </span>
              <ProbabilityChart probabilities={probabilities} predictedLevel={predictedLevel} />
            </div>
          </div>
        )}

        {/* Referral Guidance */}
        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
            <Stethoscope size={18} />
            <span>Referral Support Recommendation</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            {referralReason || 'Routine monitoring or ophthalmologist referral according to Level 2+ threshold guidelines.'}
          </p>
        </div>

        {/* Close Modal */}
        <div style={{ textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
