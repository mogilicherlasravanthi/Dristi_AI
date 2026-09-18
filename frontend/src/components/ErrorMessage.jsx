import React from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry, title = 'Unable to Process Screening Request' }) {
  if (!message) return null;

  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        border: '1.5px solid #fca5a5',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <XCircle size={22} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.35rem 0' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetry}
              style={{
                marginTop: '0.85rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.825rem',
                borderColor: '#fca5a5',
                color: '#991b1b',
                backgroundColor: '#ffffff'
              }}
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
