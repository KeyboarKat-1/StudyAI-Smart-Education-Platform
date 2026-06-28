import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, RefreshCw, Award, CheckCircle2, ShieldAlert, Loader } from 'lucide-react';

export default function WeakTopicsTab({ materialId, documentName }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWeakTopicsReport(materialId);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to run diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [materialId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <Loader className="spinner" size={32} style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>AI is diagnosing quiz records and compiling focus targets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.03)' }}>
        <p style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>{error}</p>
        <button className="secondary-btn" onClick={fetchDiagnostics} style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Run Diagnosis Again
        </button>
      </div>
    );
  }

  const weakTopics = report?.weakTopics || [];
  const isNoData = weakTopics.length === 1 && weakTopics[0].topicName === 'General Concepts' && report?.summary.includes("No quiz data");

  return (
    <div className="diagnostics-timeline">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 className="gradient-text" style={{ fontSize: '1.5rem' }}>AI Weak Topic Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>Diagnostic overview for '{documentName}' sessions.</p>
        </div>
        <button 
          className="secondary-btn" 
          onClick={fetchDiagnostics}
          style={{ padding: '8px 16px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={12} /> Sync Analyzer
        </button>
      </div>

      {/* AI diagnostic summary card */}
      <div style={{
        background: isNoData ? 'rgba(255,255,255,0.01)' : 'rgba(244, 63, 94, 0.03)',
        border: isNoData ? '1px solid var(--border-color)' : '1px solid rgba(244, 63, 94, 0.15)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '32px',
        lineHeight: 1.5,
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        {isNoData ? <ShieldAlert size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={20} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />}
        <div>
          <strong>AI Diagnostics Assessment:</strong>
          <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>{report?.summary}</p>
        </div>
      </div>

      {!isNoData && (
        <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Identified Review Targets
        </h4>
      )}

      <div className="diagnostics-list">
        {weakTopics.map((topic, index) => (
          <div key={index} className="weakness-card glassmorphism">
            <div className="weakness-info">
              <span className="weakness-badge">Review Recommended</span>
              <div className="weakness-topic-title" style={{ marginTop: '4px' }}>{topic.topicName}</div>
              <p className="weakness-review-advice" style={{ marginTop: '2px' }}>{topic.recommendedReview}</p>
            </div>
            
            <div className="weakness-score-meter">
              <span className="weakness-score-pct">Accuracy: {topic.percentageScore}%</span>
              <div className="score-bar-bg">
                <div className="score-bar-fill" style={{ width: `${topic.percentageScore}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
