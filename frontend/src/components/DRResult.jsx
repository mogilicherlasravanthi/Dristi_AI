import React from 'react';
import { Cpu, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import ProbabilityChart from './ProbabilityChart';

const SEVERITY_METADATA = {
  0: { label: 'Level 0 — No DR', name: 'No DR', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'No signs of diabetic retinopathy lesions observed in the retina.' },
  1: { label: 'Level 1 — Mild DR', name: 'Mild DR', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', desc: 'Microaneurysms only. Annual screening recommended.' },
  2: { label: 'Level 2 — Moderate DR', name: 'Moderate DR', color: '#d97706', bg: '#fffbebf', border: '#fde68a', desc: 'Microaneurysms, intraretinal hemorrhages, or exudates observed. Referral recommended.' },
  3: { label: 'Level 3 — Severe DR', name: 'Severe DR', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', desc: 'Severe hemorrhages (>20/quadrant) or venous beading. Urgent ophthalmologist referral required.' },
  4: { label: 'Level 4 — Proliferative DR', name: 'Proliferative DR', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Neovascularization or vitreous hemorrhage detected. Immediate specialist care required.' }
};

export default function DRResult({ prediction }) {
  if (!prediction) return null;

  const { level = 0, className = 'No DR', confidence = 0, probabilities = {} } = prediction;
  const meta = SEVERITY_METADATA[level] || SEVERITY_METADATA[0];

  return (
    <div className="card" style={{ borderLeft: `5px solid ${meta.color}` }}>
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="card-icon" style={{ backgroundColor: meta.bg, color: meta.color }}>
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="card-title">2. DR Severity Classification</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>EfficientNet-B0 Baseline Transfer-Learning CNN</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Prediction Confidence</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: meta.color }}>{confidence.toFixed(1)}%</span>
        </div>
      </div>

      {/* Main Prediction Banner */}
      <div style={{ backgroundColor: meta.bg, border: `1.5px solid ${meta.border}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: meta.color }}>
            PREDICTED SEVERITY LEVEL
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
            {meta.label}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, maxWidth: '500px' }}>
            {meta.desc}
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', border: `1px solid ${meta.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Model Architecture</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>EfficientNet-B0</span>
        </div>
      </div>

      {/* Probability Distribution Chart */}
      <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} className="text-primary-600" />
          <span>5-Class Probability Distribution</span>
        </h4>

        <ProbabilityChart probabilities={probabilities} predictedLevel={level} />
      </div>
    </div>
  );
}
