import React, { useState, useEffect } from 'react';
import { fetchScreeningHistory } from '../services/api';
import ScreeningDetailsModal from '../components/ScreeningDetailsModal';
import { Search, Calendar, Eye, ChevronLeft, ChevronRight, RefreshCw, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';

export default function ScreeningHistory({ onNavigateBack }) {
  const [historyData, setHistoryData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadHistory = async (page = 1, search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchScreeningHistory({ page, limit: 10, search });
      if (res && res.data) {
        setHistoryData(res.data);
        setPagination(res.pagination || { page, limit: 10, totalPages: 1, total: res.data.length });
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load screening history.');
      setHistoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, searchQuery);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    loadHistory(1, query);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadHistory(newPage, searchQuery);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', borderRadius: '12px' }}>
        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateBack}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Screening Dashboard</span>
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Patient Screening History
          </h1>
          <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
            Historical record of diabetic retinopathy evaluations and referral guidance
          </span>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', fontSize: '0.875rem' }}
            placeholder="Search by Patient ID..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* History Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin text-primary-600" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>Loading screening history records...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={() => loadHistory(1, searchQuery)} style={{ marginTop: '0.5rem' }}>
              Retry Loading
            </button>
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>No Screening Records Found</h3>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              {searchQuery ? `No patient matching '${searchQuery}'` : 'No screening records have been created yet.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Patient ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Image Quality</th>
                  <th style={{ padding: '0.85rem 1rem' }}>DR Severity Level</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Confidence</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Referral Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((rec) => {
                  const isGood = rec.imageQuality?.status === 'GOOD';
                  const isBorderline = rec.imageQuality?.status === 'BORDERLINE';
                  const isUngradable = rec.imageQuality?.status === 'UNGRADABLE';

                  const isReferral = rec.predictedLevel >= 2 || rec.referralStatus === 'REFERRAL_RECOMMENDED';

                  return (
                    <tr key={rec._id || rec.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {rec.patientId}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.825rem' }}>
                        {new Date(rec.createdAt || rec.screeningDate).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isGood ? '#f0fdf4' : isBorderline ? '#fffbebf' : '#fef2f2',
                            color: isGood ? '#16a34a' : isBorderline ? '#d97706' : '#dc2626',
                            border: `1px solid ${isGood ? '#bbf7d0' : isBorderline ? '#fde68a' : '#fca5a5'}`
                          }}
                        >
                          {isGood && <CheckCircle2 size={12} />}
                          {isBorderline && <AlertTriangle size={12} />}
                          {isUngradable && <XCircle size={12} />}
                          {rec.imageQuality?.status || 'GOOD'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {isUngradable ? (
                          <span style={{ color: '#9467bd' }}>N/A (Ungradable)</span>
                        ) : (
                          `Level ${rec.predictedLevel} — ${rec.predictedClass}`
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: isUngradable ? '#9467bd' : '#0284c7' }}>
                        {isUngradable ? 'N/A' : `${rec.confidence.toFixed(1)}%`}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor: isUngradable ? '#fef2f2' : isReferral ? '#fef2f2' : '#f0fdf4',
                            color: isUngradable ? '#dc2626' : isReferral ? '#dc2626' : '#16a34a',
                            border: `1px solid ${isUngradable ? '#fca5a5' : isReferral ? '#fca5a5' : '#bbf7d0'}`
                          }}
                        >
                          {isUngradable ? 'Recapture Required' : isReferral ? 'Referral Recommended' : 'Routine Follow-up'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }}
                          onClick={() => setSelectedRecord(rec)}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem', color: '#64748b' }}>
            <span>Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Records)</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Historical Dossier Modal */}
      {selectedRecord && (
        <ScreeningDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
