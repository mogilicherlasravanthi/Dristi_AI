import React from 'react';

const CLASS_CONFIGS = [
  { name: 'No DR', level: 0, label: 'Level 0 — No DR', color: '#16a34a' },
  { name: 'Mild DR', level: 1, label: 'Level 1 — Mild DR', color: '#0284c7' },
  { name: 'Moderate DR', level: 2, label: 'Level 2 — Moderate DR', color: '#d97706' },
  { name: 'Severe DR', level: 3, label: 'Level 3 — Severe DR', color: '#dc2626' },
  { name: 'Proliferative DR', level: 4, label: 'Level 4 — Proliferative DR', color: '#7c3aed' }
];

export default function ProbabilityChart({ probabilities = {}, predictedLevel = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {CLASS_CONFIGS.map((cls) => {
        const probVal = probabilities[cls.name] ?? probabilities[cls.label] ?? 0;
        const isSelected = cls.level === predictedLevel;

        return (
          <div key={cls.name} style={{ opacity: isSelected ? 1 : 0.85 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? '#0f172a' : '#475569' }}>
                {cls.label} {isSelected && <span style={{ color: cls.color, marginLeft: '0.3rem' }}>(Predicted)</span>}
              </span>
              <span style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? cls.color : '#64748b' }}>
                {probVal.toFixed(1)}%
              </span>
            </div>

            <div style={{ height: isSelected ? '10px' : '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, probVal))}%`,
                  backgroundColor: cls.color,
                  transition: 'width 0.5s ease-out'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
