import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Sliders, Sparkles } from 'lucide-react';

export default function QualityResult({ quality }) {
  if (!quality) return null;

  const { status, score, focusScore, illuminationScore, fovScore, recaptureRequired, enhancementApplied, reason, metrics } = quality;

  const isGood = status === 'GOOD';
  const isBorderline = status === 'BORDERLINE';
  const isUngradable = status === 'UNGRADABLE';

  const badgeColor = isGood ? '#16a34a' : isBorderline ? '#d97706' : '#dc2626';
  const badgeBg = isGood ? '#f0fdf4' : isBorderline ? '#fffbebf' : '#fef2f2';
  const badgeBorder = isGood ? '#bbf7d0' : isBorderline ? '#fde68a' : '#fca5a5';

  return (
    <div className="card" style={{ borderLeft: `5px solid ${badgeColor}` }}>
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="card-icon" style={{ backgroundColor: badgeBg, color: badgeColor }}>
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="card-title">1. Image Quality Assessment</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Front-end quality gate verification</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`,
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          {isGood && <CheckCircle2 size={16} />}
          {isBorderline && <AlertTriangle size={16} />}
          {isUngradable && <XCircle size={16} />}
          <span>QUALITY: {status} ({score}/100)</span>
        </div>
      </div>

      {/* Enhancement Notice Badge */}
      {enhancementApplied && (
        <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f766e', fontSize: '0.825rem' }}>
          <Sparkles size={16} style={{ color: '#0d9488', flexShrink: 0 }} />
          <span><strong>Adaptive Enhancement Applied:</strong> LAB-domain CLAHE & illumination equalization was automatically applied to enhance borderline contrast.</span>
        </div>
      )}

      {/* Ungradable Warning Alert */}
      {isUngradable && (
        <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '8px', padding: '0.9rem 1rem', marginBottom: '1.25rem', color: '#991b1b', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <XCircle size={18} />
            <span>Image Recapture Required</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>
            Image quality is insufficient for reliable screening. Please capture another retinal image.
          </p>
        </div>
      )}

      {/* Quality Dimension Meters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
        {/* Focus Score */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <span>Sharpness / Focus</span>
            <span>{focusScore}/100</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, focusScore)}%`, backgroundColor: focusScore >= 70 ? '#16a34a' : focusScore >= 45 ? '#d97706' : '#dc2626', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
            Laplacian Var: {metrics?.laplacianVar ?? metrics?.laplacian_var ?? 'N/A'}
          </span>
        </div>

        {/* Illumination Score */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <span>Illumination & Contrast</span>
            <span>{illuminationScore}/100</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, illuminationScore)}%`, backgroundColor: illuminationScore >= 70 ? '#16a34a' : illuminationScore >= 45 ? '#d97706' : '#dc2626', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
            Mean Luminance: {metrics?.meanBrightness ?? metrics?.mean_brightness ?? 'N/A'}
          </span>
        </div>

        {/* Field of View Score */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <span>Field of View (FOV)</span>
            <span>{fovScore}/100</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, fovScore)}%`, backgroundColor: fovScore >= 70 ? '#16a34a' : fovScore >= 45 ? '#d97706' : '#dc2626', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
            Retinal Area: {(metrics?.fovAreaRatio ?? metrics?.fov_area_ratio) !== undefined ? `${((metrics?.fovAreaRatio ?? metrics?.fov_area_ratio) * 100).toFixed(1)}%` : 'N/A'}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.85rem', marginBottom: 0, fontStyle: 'italic' }}>
        {reason}
      </p>
    </div>
  );
}
