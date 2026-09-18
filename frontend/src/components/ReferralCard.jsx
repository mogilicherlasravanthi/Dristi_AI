import React from 'react';
import { UserCheck, AlertTriangle, Stethoscope, RotateCcw, HelpCircle } from 'lucide-react';

export default function ReferralCard({ referral, qualityStatus, confidence = 0 }) {
  if (!referral) return null;

  const isUngradable = qualityStatus === 'UNGRADABLE' || referral.status === 'RECAPTURE_REQUIRED';
  const isLowConfidence = confidence < 70.0 && !isUngradable;

  let title = referral.recommendation || 'Referral Support Decision';
  let icon = <Stethoscope size={22} />;
  let color = '#0284c7';
  let bg = '#f0f9ff';
  let border = '#bae6fd';

  if (isUngradable) {
    title = 'Image Recapture Required';
    icon = <RotateCcw size={22} />;
    color = '#dc2626';
    bg = '#fef2f2';
    border = '#fca5a5';
  } else if (isLowConfidence) {
    title = 'Specialist Review Recommended (Low AI Confidence)';
    icon = <HelpCircle size={22} />;
    color = '#d97706';
    bg = '#fffbebf';
    border = '#fde68a';
  } else if (referral.status === 'REFERRAL_RECOMMENDED' || referral.status === 'REFERRAL') {
    title = 'Ophthalmologist Referral Recommended';
    icon = <AlertTriangle size={22} />;
    color = '#dc2626';
    bg = '#fef2f2';
    border = '#fca5a5';
  } else {
    title = 'Routine Annual Monitoring / Follow-up';
    icon = <UserCheck size={22} />;
    color = '#16a34a';
    bg = '#f0fdf4';
    border = '#bbf7d0';
  }

  return (
    <div className="card" style={{ borderLeft: `5px solid ${color}` }}>
      <div className="card-header">
        <div className="card-icon" style={{ backgroundColor: bg, color }}>
          {icon}
        </div>
        <div>
          <h2 className="card-title">3. Referral Support Guidance</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Prototype decision-support protocol for rural health workers</span>
        </div>
      </div>

      <div style={{ backgroundColor: bg, border: `1.5px solid ${border}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color, fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.4rem' }}>
          {icon}
          <span>{title}</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
          {referral.reason}
        </p>
      </div>

      <div style={{ fontSize: '0.775rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
        <strong>Note:</strong> Referral support is a prototype decision-assistance recommendation based on Level 2+ DR threshold rules. It does NOT replace clinical evaluation by a licensed ophthalmologist.
      </div>
    </div>
  );
}
