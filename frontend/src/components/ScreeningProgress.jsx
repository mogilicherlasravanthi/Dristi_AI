import React from 'react';
import { CheckCircle2, Loader2, Circle, ArrowRight } from 'lucide-react';

const STAGES = [
  { id: 'upload', label: 'Capture & Upload' },
  { id: 'quality', label: 'Image Quality Check' },
  { id: 'preprocess', label: 'Preprocessing' },
  { id: 'classify', label: 'DR Classification' },
  { id: 'explain', label: 'Grad-CAM Explanation' },
  { id: 'referral', label: 'Referral Support' }
];

export default function ScreeningProgress({ currentStage, isProcessing }) {
  const getStageIndex = (stageId) => STAGES.findIndex((s) => s.id === stageId);
  const activeIdx = getStageIndex(currentStage);

  return (
    <div className="workflow-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 className="workflow-title" style={{ margin: 0 }}>Screening Pipeline Workflow</h3>
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
            <Loader2 size={15} className="animate-spin" />
            <span>Processing Pipeline...</span>
          </div>
        )}
      </div>

      <div className="workflow-steps">
        {STAGES.map((stage, idx) => {
          const isDone = activeIdx > idx;
          const isCurrent = activeIdx === idx;

          return (
            <React.Fragment key={stage.id}>
              <div className={`workflow-step ${isCurrent ? 'active' : ''}`}>
                <div
                  className="step-number"
                  style={{
                    backgroundColor: isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#e2e8f0',
                    color: isDone || isCurrent ? '#ffffff' : '#64748b'
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} />
                  ) : isCurrent && isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className="step-label"
                  style={{
                    color: isDone ? '#16a34a' : isCurrent ? '#0369a1' : '#64748b',
                    fontWeight: isDone || isCurrent ? 600 : 400
                  }}
                >
                  {stage.label}
                </span>
              </div>

              {idx < STAGES.length - 1 && (
                <div className="workflow-arrow" style={{ color: isDone ? '#16a34a' : '#cbd5e1' }}>
                  <ArrowRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
