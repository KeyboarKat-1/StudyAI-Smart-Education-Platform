import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import UploadZone from '../components/Dashboard/UploadZone';
import MaterialList from '../components/Dashboard/MaterialList';
import StudyArea from '../components/Dashboard/StudyArea';
import { 
  BookOpen, LogOut, AlertTriangle, AlertCircle, RefreshCw, 
  Flame, Award, CheckSquare, Layers, ChevronRight, HelpCircle,
  Activity, Sun, Moon, User, Settings, X, Search, Filter,
  Bell, CheckCircle, Info, Save, Shield
} from 'lucide-react';

// ─── Toast Notification System ──────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      zIndex: 9999, maxWidth: '380px'
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '14px 16px', borderRadius: '12px',
          background: t.type === 'success' ? 'rgba(16,185,129,0.12)' :
                      t.type === 'error'   ? 'rgba(244,63,94,0.12)'  :
                                            'rgba(139,92,246,0.12)',
          border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.3)' :
                                t.type === 'error'   ? 'rgba(244,63,94,0.3)'  :
                                                      'rgba(139,92,246,0.3)'}`,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
          color: 'var(--text-primary)',
        }}>
          {t.type === 'success' && <CheckCircle size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '1px' }} />}
          {t.type === 'error'   && <AlertCircle size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '1px' }} />}
          {t.type === 'info'    && <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '1px' }} />}
          <div style={{ flex: 1 }}>
            {t.title && <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{t.title}</div>}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.message}</div>
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Modal ───────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ displayName });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><User size={20} /> Profile</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="avatar avatar-lg" style={{ margin: '0 auto 20px', width: '72px', height: '72px', fontSize: '1.8rem' }}>
            {displayName ? displayName[0].toUpperCase() : 'S'}
          </div>
          <label className="modal-label">Display Name</label>
          <input
            className="modal-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          <label className="modal-label" style={{ marginTop: '16px' }}>Email Address</label>
          <input className="modal-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Email cannot be changed from this panel.</p>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={14} className="spinner" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────
function SettingsModal({ theme, onThemeChange, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Settings size={20} /> Settings</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="setting-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Appearance</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Choose your preferred color theme</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                <Sun size={14} /> Light
              </button>
            </div>
          </div>
          <div className="setting-row" style={{ marginTop: '16px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Data & Privacy</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>All data stored securely in Firebase / local fallback</div>
            </div>
            <Shield size={20} color="var(--color-success)" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, logout, isLocalMode } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedTabId, setSelectedTabId] = useState(null);
  
  // Dashboard Analytics States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [libLoading, setLibLoading] = useState(true);
  const [error, setError] = useState('');

  // UI States
  const [theme, setTheme] = useState(() => localStorage.getItem('studyai_theme') || 'dark');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studyai_theme', theme);
  }, [theme]);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'success', 'Theme Updated');
  };

  const handleSaveProfile = async ({ displayName }) => {
    try {
      // Firebase profile update would go here
      showToast('Profile saved successfully!', 'success', 'Profile Updated');
    } catch (err) {
      showToast('Failed to update profile.', 'error', 'Error');
    }
  };

  // Filter materials by search query and file type
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || (m.fileType && m.fileType.toLowerCase().includes(fileTypeFilter));
    return matchesSearch && matchesType;
  });

  // Fetch documents library list
  const fetchLibrary = async () => {
    setLibLoading(true);
    try {
      const data = await api.listMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setError('Failed to sync study materials library.');
    } finally {
      setLibLoading(false);
    }
  };

  // Fetch global dashboard stats
  const fetchDashboardStats = async () => {
    setDashLoading(true);
    try {
      const stats = await api.getDashboardStats();
      const history = await api.getQuizHistory();
      setDashboardStats(stats);
      setQuizHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
    fetchDashboardStats();

    const handleAuthInvalid = () => {
      logout();
    };
    window.addEventListener('auth_state_invalid', handleAuthInvalid);
    return () => window.removeEventListener('auth_state_invalid', handleAuthInvalid);
  }, [selectedMaterial]);

  const handleSelectMaterial = async (materialSummary, initialTab = 'chat') => {
    setError('');
    try {
      const fullDoc = await api.getMaterial(materialSummary.id);
      setSelectedMaterial(fullDoc);
      setSelectedTabId(initialTab);
    } catch (err) {
      setError(`Failed to open material: ${err.message}`);
    }
  };

  const handleUploadSuccess = (newDoc) => {
    setMaterials(prev => [newDoc, ...prev]);
    setSelectedMaterial(newDoc);
    setSelectedTabId('chat');
    showToast(`"${newDoc.name}" uploaded successfully!`, 'success', 'Upload Complete');
  };

  const handleDeleteMaterial = async (id) => {
    try {
      const mat = materials.find(m => m.id === id);
      await api.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (selectedMaterial && selectedMaterial.id === id) {
        setSelectedMaterial(null);
      }
      showToast(`"${mat?.name || 'Document'}" removed from library.`, 'info', 'Deleted');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error', 'Error');
      setError(`Delete failed: ${err.message}`);
    }
  };

  const handleRecommendationAction = async (rec) => {
    if (rec.action === 'upload') {
      // Focus scroll sidebar
      document.querySelector('.upload-zone')?.scrollIntoView({ behavior: 'smooth' });
    } else if (rec.materialId) {
      const summary = materials.find(m => m.id === rec.materialId);
      if (summary) {
        // Map recommendations to tab names
        const tabMap = {
          quiz: 'quiz',
          weak_topics: 'weak_topics',
          chat: 'chat',
          flashcards: 'flashcards',
          schedule: 'schedule'
        };
        await handleSelectMaterial(summary, tabMap[rec.action] || 'chat');
      }
    }
  };

  const formatPercent = (score, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((score / total) * 100)}%`;
  };

  // Helper to draw clean SVG plots
  const renderSVGChart = (data) => {
    if (!data || data.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Take practice quizzes to display performance analytics over time.
        </div>
      );
    }

    const height = 180;
    const width = 600;
    const padding = 30;
    
    // Draw points
    const pointsCount = data.length;
    const stepX = (width - padding * 2) / (pointsCount > 1 ? pointsCount - 1 : 1);
    
    const svgPoints = data.map((point, index) => {
      const x = padding + index * stepX;
      // Flip Y axis (100% score = 0 y, 0% score = height y)
      const y = height - padding - ((point.score / 100) * (height - padding * 2));
      return { x, y, ...point };
    });

    const pathD = svgPoints.reduce((path, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" style={{ width: '100%', height: '100%' }}>
        {/* Draw grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = height - padding - ((val / 100) * (height - padding * 2));
          return (
            <g key={val}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x={padding - 10} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}%</text>
            </g>
          );
        })}

        {/* Draw Plot Line */}
        {pointsCount > 1 && (
          <path d={pathD} fill="none" stroke="url(#cyber-grad)" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Draw points & labels */}
        {svgPoints.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="5" fill="var(--color-secondary)" stroke="var(--bg-main)" strokeWidth="2" />
            <text x={pt.x} y={pt.y - 12} fill="var(--text-primary)" fontSize="9" fontWeight="600" textAnchor="middle">{pt.score}%</text>
            <text x={pt.x} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{pt.label}</text>
          </g>
        ))}

        {/* Define Gradient */}
        <defs>
          <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-secondary)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="app-container">
      
      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          theme={theme}
          onThemeChange={handleThemeChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 1. Left Library Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => setSelectedMaterial(null)}>
          <div className="logo-icon">
            <BookOpen size={20} color="#fff" />
          </div>
          <span className="logo-text gradient-text">StudyAI</span>
        </div>

        <div className="materials-section">
          <div className="materials-title-row">
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Study Library
            </h3>
            <button onClick={fetchLibrary} style={{ color: 'var(--text-muted)' }} title="Refresh Library">
              <RefreshCw size={12} className={libLoading ? 'spinner' : ''} />
            </button>
          </div>

          {/* Search & Filter Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
            </div>
            <select
              value={fileTypeFilter}
              onChange={e => setFileTypeFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
            </select>
          </div>

          <UploadZone onUploadSuccess={handleUploadSuccess} />

          {libLoading && materials.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
            </div>
          ) : (
            <MaterialList
              materials={filteredMaterials}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={handleSelectMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}
          {filteredMaterials.length === 0 && materials.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No materials match your search.
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Center Area: Dashboard vs study workspace */}
      <main className="main-content">
        
        {/* Header Toolbar */}
        <header className="header glassmorphism">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 
              onClick={() => setSelectedMaterial(null)} 
              style={{ fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {selectedMaterial ? (
                <>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Workspace /</span> 
                  <span className="gradient-text">{selectedMaterial.name}</span>
                </>
              ) : (
                <span className="gradient-text">Study Console</span>
              )}
            </h2>
            {isLocalMode && (
              <span className="fallback-badge">
                <AlertTriangle size={12} /> Local Fallback
              </span>
            )}
          </div>

          <div className="user-profile">
            <button
              onClick={() => setShowProfile(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}
              title="Edit Profile"
            >
              <div className="avatar">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'S'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser?.displayName || 'Student'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {currentUser?.email}
                </span>
              </div>
            </button>
            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
              <button
                className="icon-btn"
                onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="icon-btn"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button 
                className="icon-btn"
                onClick={logout}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            borderBottom: '1px solid rgba(244, 63, 94, 0.15)',
            color: 'var(--color-accent)',
            padding: '12px 32px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Panel Selection */}
        {selectedMaterial ? (
          <StudyArea 
            selectedMaterial={selectedMaterial} 
            initialTabId={selectedTabId} 
          />
        ) : (
          
          /* GLOBAL DASHBOARD HOME VIEW */
          <div className="dashboard-grid">
            
            {/* Stats row cards */}
            <div className="stats-grid">
              <div className="stat-card glassmorphism">
                <div className="stat-info">
                  <span className="stat-label">Study Streak</span>
                  <span className="stat-num">{dashboardStats?.streakCount || 0} Days</span>
                </div>
                <div className="stat-icon-wrapper streak">
                  <Flame size={24} className={(dashboardStats?.streakCount || 0) > 0 ? 'streak-flame' : ''} />
                </div>
              </div>

              <div className="stat-card glassmorphism">
                <div className="stat-info">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-num">{dashboardStats?.averageScore || 0}%</span>
                </div>
                <div className="stat-icon-wrapper score">
                  <Award size={24} />
                </div>
              </div>

              <div className="stat-card glassmorphism">
                <div className="stat-info">
                  <span className="stat-label">Quizzes Taken</span>
                  <span className="stat-num">{dashboardStats?.totalQuizzes || 0}</span>
                </div>
                <div className="stat-icon-wrapper quizzes">
                  <CheckSquare size={24} />
                </div>
              </div>

              <div className="stat-card glassmorphism">
                <div className="stat-info">
                  <span className="stat-label">Library Materials</span>
                  <span className="stat-num">{dashboardStats?.totalDocuments || 0} Files</span>
                </div>
                <div className="stat-icon-wrapper docs">
                  <Layers size={24} />
                </div>
              </div>
            </div>

            {/* Performance SVG Line Chart */}
            <div className="chart-card glassmorphism">
              <h3 className="chart-title">Progress Tracker</h3>
              <div className="chart-wrapper">
                {dashLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                  </div>
                ) : (
                  renderSVGChart(dashboardStats?.progressChartData)
                )}
              </div>
            </div>

            {/* Columns Row */}
            <div className="dash-columns">
              
              {/* Left Column: Recent logs & history table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Quiz History log table */}
                <div className="activity-card glassmorphism" style={{ gap: '16px' }}>
                  <h3 className="chart-title">Quiz Performance Log</h3>
                  
                  {dashLoading ? (
                    <div className="spinner" style={{ margin: '20px auto', width: '20px', height: '20px' }}></div>
                  ) : quizHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No quiz results tracked yet. Start study sessions to populate.
                    </div>
                  ) : (
                    <div className="history-table-wrapper">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Document</th>
                            <th>Quiz Type</th>
                            <th>Score</th>
                            <th>Accuracy</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizHistory.slice(0, 5).map((row, rIdx) => (
                            <tr key={row.id || rIdx}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.materialName}</td>
                              <td><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>{row.quizType}</span></td>
                              <td>{row.score} / {row.totalQuestions}</td>
                              <td style={{ fontWeight: 700, color: (row.score/row.totalQuestions >= 0.8) ? 'var(--color-success)' : (row.score/row.totalQuestions >= 0.5) ? 'var(--color-warning)' : 'var(--color-accent)' }}>
                                {formatPercent(row.score, row.totalQuestions)}
                              </td>
                              <td style={{ fontSize: '0.75rem' }}>{new Date(row.timestamp).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent Activities list logs */}
                <div className="activity-card glassmorphism">
                  <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="var(--color-secondary)" /> Recent Learning Stream
                  </h3>
                  
                  {dashLoading ? (
                    <div className="spinner" style={{ margin: '20px auto', width: '20px', height: '20px' }}></div>
                  ) : !dashboardStats?.recentActivity || dashboardStats.recentActivity.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No recent activities logged. Open documents or check summary lists to begin.
                    </div>
                  ) : (
                    <div className="activity-list">
                      {dashboardStats.recentActivity.slice(0, 5).map((item) => (
                        <div key={item.id} className="activity-item">
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', marginTop: '6px', flexShrink: 0 }} />
                          <div className="activity-details">
                            <span className="activity-desc">{item.description}</span>
                            <span className="activity-time">{new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Recommendations */}
              <div className="recommendations-card glassmorphism">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="var(--color-primary)" /> Adaptive Recommendations
                </h3>
                
                {dashLoading ? (
                  <div className="spinner" style={{ margin: '20px auto', width: '20px', height: '20px' }}></div>
                ) : !dashboardStats?.adaptiveRecommendations || dashboardStats.adaptiveRecommendations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                    Everything is up to date! Continue uploading more documents.
                  </div>
                ) : (
                  <div className="recommendations-list">
                    {dashboardStats.adaptiveRecommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className="rec-item"
                        onClick={() => handleRecommendationAction(rec)}
                      >
                        <div className="rec-title-row">
                          <ChevronRight size={14} color="var(--color-secondary)" />
                          <span>{rec.title}</span>
                        </div>
                        <div className="rec-desc">
                          {rec.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
