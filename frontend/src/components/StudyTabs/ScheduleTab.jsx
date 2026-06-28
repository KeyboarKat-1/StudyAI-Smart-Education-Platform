import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, CheckCircle2, RefreshCw, AlertCircle, Loader, Download } from 'lucide-react';

export default function ScheduleTab({ materialId, documentName }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local checklists completions state: { "day-idx": [true, false] }
  const [completions, setCompletions] = useState({});

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudySchedule(materialId);
      setSchedule(data.schedule || []);
      
      // Initialize checklists state
      const initialCompletions = {};
      (data.schedule || []).forEach((day, dIdx) => {
        initialCompletions[dIdx] = new Array(day.checklist.length).fill(false);
      });
      
      // Look for saved schedule states in localStorage
      const cached = localStorage.getItem(`studyai_schedule_${materialId}`);
      if (cached) {
        try {
          setCompletions(JSON.parse(cached));
        } catch (e) {
          setCompletions(initialCompletions);
        }
      } else {
        setCompletions(initialCompletions);
      }
    } catch (err) {
      setError(err.message || 'Failed to construct study schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [materialId]);

  const toggleCheck = (dayIdx, taskIdx) => {
    const updated = {
      ...completions,
      [dayIdx]: completions[dayIdx].map((c, i) => i === taskIdx ? !c : c)
    };
    setCompletions(updated);
    localStorage.setItem(`studyai_schedule_${materialId}`, JSON.stringify(updated));
    
    // Log user study activity to dashboard history if they check a task
    if (updated[dayIdx][taskIdx]) {
      const dayData = schedule[dayIdx];
      api.logActivity(`Completed task: "${dayData.checklist[taskIdx]}" under Day ${dayData.day} Study Plan`);
    }
  };

  // Print / Export PDF — uses browser's native print dialog
  const handleExportPDF = () => {
    const printContent = document.getElementById('schedule-print-area');
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = `
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
        h1 { font-size: 1.4rem; margin-bottom: 4px; }
        p.subtitle { color: #64748b; margin-bottom: 24px; font-size: 0.9rem; }
        .day-block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .day-badge { font-weight: 800; color: #8b5cf6; font-size: 1rem; margin-bottom: 8px; }
        .day-topic { font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
        .day-desc { font-size: 0.82rem; color: #475569; margin-bottom: 12px; }
        .task-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.85rem; }
        .task-box { width: 14px; height: 14px; border: 2px solid #8b5cf6; border-radius: 3px; flex-shrink: 0; }
        .task-box.done { background: #8b5cf6; }
        @media print { body { padding: 0; } }
      </style>
      <h1>📅 StudyAI — 7-Day Study Plan</h1>
      <p class="subtitle">Document: ${documentName || 'Study Material'} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      ${schedule.map((day, dIdx) => `
        <div class="day-block">
          <div class="day-badge">Day ${day.day}</div>
          <div class="day-topic">${day.topic}</div>
          <div class="day-desc">${day.description}</div>
          ${day.checklist.map((task, tIdx) => `
            <div class="task-item">
              <div class="task-box ${(completions[dIdx] && completions[dIdx][tIdx]) ? 'done' : ''}"></div>
              <span>${task}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    `;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload(); // Restore React app after print
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <Loader className="spinner" size={32} style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>AI is dividing contents into a personalized 7-Day Study Calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.03)' }}>
        <p style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>{error}</p>
        <button className="secondary-btn" onClick={fetchSchedule} style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Re-generate Plan
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-timeline" id="schedule-print-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 className="gradient-text" style={{ fontSize: '1.5rem' }}>Personalized 7-Day Timeline</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>Follow this roadmap to master the concepts in <strong>{documentName}</strong>.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="secondary-btn" 
            onClick={handleExportPDF}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <Download size={12} /> Export PDF
          </button>
          <button 
            className="secondary-btn" 
            onClick={() => {
              if (window.confirm("Are you sure you want to regenerate this schedule plan?")) {
                localStorage.removeItem(`studyai_schedule_${materialId}`);
                fetchSchedule();
              }
            }}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={12} /> Replan
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {schedule.map((day, dIdx) => (
          <div key={dIdx} className="day-card glassmorphism">
            <div className="day-badge">
              <span>Day</span>
              {day.day}
            </div>
            <div className="day-content">
              <div className="day-topic">{day.topic}</div>
              <p className="day-desc">{day.description}</p>
              
              <div className="checklist-items">
                {day.checklist.map((task, tIdx) => {
                  const isChecked = completions[dIdx] && completions[dIdx][tIdx];
                  return (
                    <label 
                      key={tIdx} 
                      className={`check-item ${isChecked ? 'completed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked || false}
                        onChange={() => toggleCheck(dIdx, tIdx)}
                      />
                      <span>{task}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
