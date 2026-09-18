import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimer() {
  return (
    <div
      style={{
        backgroundColor: '#fffbebf',
        border: '1px solid #fcd34d',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#92400e',
        fontSize: '0.875rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <ShieldAlert size={20} style={{ flexShrink: 0, color: '#d97706' }} />
      <div>
        <strong style={{ fontWeight: 600 }}>Medical AI Disclaimer:</strong>{' '}
        Dristi AI provides AI-assisted screening support for rural healthcare workers. This output is a referral support recommendation and does NOT constitute a definitive clinical diagnosis. Final clinical decisions must be made by a certified healthcare professional or ophthalmologist.
      </div>
    </div>
  );
}
