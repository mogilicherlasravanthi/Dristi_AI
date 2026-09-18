import React from 'react';
import { Eye, Activity, History, PlusCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function Header({ activeTab, onTabChange, mockScenario, onMockScenarioChange, onOpenHelp }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-logo-badge" title="Dristi AI">
            <Eye size={24} className="text-white" />
          </div>
          <div>
            <div className="brand-title">Dristi AI</div>
            <div className="brand-subtitle">Diabetic Retinopathy Screening</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'dashboard' ? '#ffffff' : 'transparent',
              color: activeTab === 'dashboard' ? '#0f172a' : '#cbd5e1',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle size={16} />
            <span>New Screening</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#0f172a' : '#cbd5e1',
              transition: 'all 0.2s'
            }}
          >
            <History size={16} />
            <span>Screening History</span>
          </button>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mock Scenario Switcher */}
          <div className="mock-selector-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            <Sparkles size={14} className="text-amber-400" />
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Dev Mode:</span>
            <select
              value={mockScenario}
              onChange={(e) => onMockScenarioChange(e.target.value)}
              style={{ background: 'transparent', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', outline: 'none' }}
            >
              <option value="GOOD" style={{ background: '#0f172a', color: '#fff' }}>Good Quality (Moderate DR)</option>
              <option value="BORDERLINE" style={{ background: '#0f172a', color: '#fff' }}>Borderline Quality (Enhanced)</option>
              <option value="UNGRADABLE" style={{ background: '#0f172a', color: '#fff' }}>Ungradable Quality (Recapture)</option>
            </select>
          </div>

          <button
            onClick={onOpenHelp}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <HelpCircle size={15} />
            <span>Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
