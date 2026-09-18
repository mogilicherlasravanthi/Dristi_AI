import React, { useState } from 'react';
import { Eye, Layers, HelpCircle, Info, Sparkles } from 'lucide-react';

export default function GradCAMViewer({ originalImage, heatmapUrl, overlayUrl, predictedClass = 'Moderate DR' }) {
  const [activeTab, setActiveTab] = useState('overlay'); // 'original' | 'heatmap' | 'overlay' | 'grid'

  return (
    <div className="card">
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="card-icon" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
            <Layers size={18} />
          </div>
          <div>
            <h2 className="card-title">4. Grad-CAM Model Explainability</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Visual activation heatmaps highlighting model attention</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'grid' ? '#ffffff' : 'transparent',
              color: activeTab === 'grid' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Side-by-Side Grid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overlay')}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'overlay' ? '#ffffff' : 'transparent',
              color: activeTab === 'overlay' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'overlay' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Overlay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('original')}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'original' ? '#ffffff' : 'transparent',
              color: activeTab === 'original' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'original' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Original
          </button>
        </div>
      </div>

      {/* Primary Explanation Banner */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={16} className="text-purple-600" style={{ flexShrink: 0 }} />
        <span>
          <strong>Explainability Guide:</strong> Highlighted regions show areas in the fundus photograph that contributed most to the model's <strong>{predictedClass}</strong> prediction.
        </span>
      </div>

      {/* Render Images */}
      {activeTab === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {/* 1. Original Retinal Image */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
            <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#1e293b', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              1. Original Retinal Image
            </div>
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={originalImage} alt="Original Retinal Image" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          {/* 2. Grad-CAM Heatmap */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
            <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#1e293b', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              2. AI Attention Map
            </div>
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {heatmapUrl ? (
                <img src={heatmapUrl} alt="Grad-CAM Heatmap" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <MockHeatmapCanvas originalImage={originalImage} mode="heatmap" />
              )}
            </div>
          </div>

          {/* 3. Grad-CAM Overlay */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
            <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#1e293b', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              3. Explanation Overlay
            </div>
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {overlayUrl ? (
                <img src={overlayUrl} alt="Explanation Overlay" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <MockHeatmapCanvas originalImage={originalImage} mode="overlay" />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '1rem', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {activeTab === 'original' && (
            <img src={originalImage} alt="Original Retinal Image" style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }} />
          )}
          {activeTab === 'overlay' && (
            overlayUrl ? (
              <img src={overlayUrl} alt="Explanation Overlay" style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <MockHeatmapCanvas originalImage={originalImage} mode="overlay" height={340} />
            )
          )}
          {activeTab === 'heatmap' && (
            heatmapUrl ? (
              <img src={heatmapUrl} alt="AI Attention Map" style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <MockHeatmapCanvas originalImage={originalImage} mode="heatmap" height={340} />
            )
          )}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div style={{ backgroundColor: '#fffbebf', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
        <span>
          <strong>Explainability Disclosure:</strong> Grad-CAM highlights feature activations within the neural network to explain model focus. Highlighting indicates neural attention regions and does NOT represent confirmed clinical lesion annotations or validated microaneurysm detections.
        </span>
      </div>
    </div>
  );
}

/**
 * Mock Canvas Generator for visual heatmap representation when standalone API runs in dev mode
 */
function MockHeatmapCanvas({ originalImage, mode = 'overlay', height = 200 }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={originalImage} alt="Base Fundus" style={{ maxHeight: `${height}px`, maxWidth: '100%', objectFit: 'contain', opacity: mode === 'heatmap' ? 0.3 : 0.85 }} />
      {/* Simulated Jet Colormap Heatmap Radial Overlay */}
      <div
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.75) 0%, rgba(245, 158, 11, 0.5) 45%, rgba(59, 130, 246, 0.2) 75%, rgba(0, 0, 0, 0) 100%)',
          filter: 'blur(8px)',
          mixBlendMode: mode === 'overlay' ? 'color-dodge' : 'normal',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
