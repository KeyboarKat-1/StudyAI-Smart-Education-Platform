import React from 'react';
import { FileText, Trash2, Calendar, Database } from 'lucide-react';

export default function MaterialList({ 
  materials, 
  selectedMaterial, 
  onSelectMaterial, 
  onDeleteMaterial 
}) {
  
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  if (materials.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'var(--text-muted)',
        border: '1px dashed var(--border-color)',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.005)'
      }}>
        <FileText size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.85rem' }}>No study materials uploaded yet.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Upload a file above to get started.</p>
      </div>
    );
  }

  return (
    <div className="materials-list">
      {materials.map((material) => {
        const isSelected = selectedMaterial && selectedMaterial.id === material.id;
        
        return (
          <div 
            key={material.id}
            className={`material-card ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectMaterial(material)}
          >
            <div className="material-info">
              <div className="file-icon-box">
                <FileText size={20} />
              </div>
              <div className="file-meta">
                <div className="file-name" title={material.name}>
                  {material.name}
                </div>
                <div className="file-details">
                  <span>{material.type}</span>
                  <span>•</span>
                  <span>{formatBytes(material.size)}</span>
                  <span>•</span>
                  <span>{material.wordCount || 0} words</span>
                </div>
              </div>
            </div>
            
            <button 
              className="delete-material-btn"
              onClick={(e) => {
                e.stopPropagation(); // Stop selection trigger
                if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
                  onDeleteMaterial(material.id);
                }
              }}
              aria-label={`Delete ${material.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
