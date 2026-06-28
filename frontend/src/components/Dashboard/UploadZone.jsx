import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { UploadCloud, FileText, AlertCircle, Loader } from 'lucide-react';

export default function UploadZone({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.docx', '.txt'];
    
    if (!allowed.includes(ext)) {
      setError('Unsupported file type. Only PDF, DOCX, and TXT are supported.');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Limit is 10MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const response = await api.uploadMaterial(file);
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and parse file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  return (
    <div className="upload-container">
      <form 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="input-file-upload"
          className="file-input-hidden"
          style={{ display: 'none' }}
          onChange={handleChange}
          accept=".pdf,.docx,.txt"
          disabled={uploading}
        />
        
        <div 
          className={`upload-zone ${dragActive ? "dragging" : ""} ${uploading ? "uploading-state" : ""}`}
          onClick={!uploading ? onButtonClick : null}
        >
          {uploading ? (
            <>
              <Loader className="spinner" size={32} />
              <div className="upload-text">Processing document text...</div>
              <div className="upload-limits">This may take a moment for large files.</div>
            </>
          ) : (
            <>
              <UploadCloud className="upload-icon" size={32} />
              <div className="upload-text">
                <span>Click to upload</span> or drag & drop
              </div>
              <div className="upload-limits">PDF, DOCX, TXT up to 10MB</div>
            </>
          )}
        </div>
      </form>

      {error && (
        <div style={{
          marginTop: '8px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.15)',
          color: 'var(--color-accent)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          lineHeight: 1.4
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
