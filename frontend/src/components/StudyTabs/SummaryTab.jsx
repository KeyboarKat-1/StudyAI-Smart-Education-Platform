import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Copy, Check, RefreshCw, Loader } from 'lucide-react';

export default function SummaryTab({ materialId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSummary(materialId);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Failed to generate study summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [materialId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (mdText) => {
    if (!mdText) return null;
    
    // Very simple regex markdown parser for custom aesthetics
    const lines = mdText.split('\n');
    let insideList = false;
    let listItems = [];
    const elements = [];

    const flushList = (key) => {
      if (insideList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} style={{ paddingLeft: '20px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            {listItems}
          </ul>
        );
        listItems = [];
        insideList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Parse markdown headers
      if (trimmed.startsWith('# ')) {
        flushList(index);
        elements.push(<h2 key={index} className="gradient-text" style={{ fontSize: '1.75rem', marginTop: '24px', marginBottom: '12px' }}>{trimmed.slice(2)}</h2>);
      } else if (trimmed.startsWith('## ')) {
        flushList(index);
        elements.push(<h3 key={index} style={{ color: 'var(--color-secondary)', fontSize: '1.35rem', marginTop: '20px', marginBottom: '10px' }}>{trimmed.slice(3)}</h3>);
      } else if (trimmed.startsWith('### ')) {
        flushList(index);
        elements.push(<h4 key={index} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginTop: '16px', marginBottom: '8px' }}>{trimmed.slice(4)}</h4>);
      } 
      // Parse list items
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        insideList = true;
        const itemText = trimmed.slice(2);
        listItems.push(<li key={`li-${index}`} style={{ marginBottom: '6px' }}>{parseInlineStyles(itemText)}</li>);
      } 
      // Parse blockquotes
      else if (trimmed.startsWith('> ')) {
        flushList(index);
        // Look for alert tags like [!NOTE], [!IMPORTANT], etc.
        let alertType = 'default';
        let alertText = trimmed.slice(2);
        
        if (alertText.startsWith('[!NOTE]')) {
          alertType = 'note';
          alertText = alertText.replace('[!NOTE]', '').trim();
        } else if (alertText.startsWith('[!TIP]')) {
          alertType = 'tip';
          alertText = alertText.replace('[!TIP]', '').trim();
        } else if (alertText.startsWith('[!IMPORTANT]')) {
          alertType = 'important';
          alertText = alertText.replace('[!IMPORTANT]', '').trim();
        }

        const borderColors = {
          note: 'var(--color-secondary)',
          tip: 'var(--color-success)',
          important: 'var(--color-warning)',
          default: 'var(--color-primary)'
        };

        const bgColors = {
          note: 'rgba(6, 182, 212, 0.04)',
          tip: 'rgba(16, 185, 129, 0.04)',
          important: 'rgba(245, 158, 11, 0.04)',
          default: 'rgba(139, 92, 246, 0.04)'
        };

        elements.push(
          <blockquote 
            key={index} 
            style={{ 
              borderLeft: `4px solid ${borderColors[alertType]}`,
              background: bgColors[alertType],
              padding: '16px',
              borderRadius: '0 8px 8px 0',
              marginBottom: '20px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)'
            }}
          >
            {parseInlineStyles(alertText)}
          </blockquote>
        );
      } 
      // Empty line
      else if (trimmed === '') {
        flushList(index);
      } 
      // Regular paragraphs
      else {
        flushList(index);
        elements.push(<p key={index} style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{parseInlineStyles(trimmed)}</p>);
      }
    });

    flushList(lines.length);
    return elements;
  };

  // Helper to parse bold text **like this**
  const parseInlineStyles = (text) => {
    // Basic bold parsing: **text**
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <Loader className="spinner" size={32} style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>AI is constructing study summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.03)' }}>
        <p style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>{error}</p>
        <button className="secondary-btn" onClick={fetchSummary} style={{ margin: '0 auto' }}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="summary-container" style={{ position: 'relative' }}>
      <div className="summary-actions">
        <button 
          className="secondary-btn" 
          onClick={handleCopy}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {copied ? (
            <>
              <Check size={14} color="var(--color-success)" /> Copied!
            </>
          ) : (
            <>
              <Copy size={14} /> Copy Summary
            </>
          )}
        </button>
      </div>
      <div className="markdown-body">
        {renderMarkdown(summary)}
      </div>
    </div>
  );
}
