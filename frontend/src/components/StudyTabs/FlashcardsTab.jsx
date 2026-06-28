import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArrowLeft, ArrowRight, RefreshCw, HelpCircle, AlertCircle, Loader, Download } from 'lucide-react';

export default function FlashcardsTab({ materialId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFlashcards = async () => {
    setLoading(true);
    setError('');
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      const data = await api.getFlashcards(materialId);
      setFlashcards(data.flashcards || []);
    } catch (err) {
      setError(err.message || 'Failed to generate study flashcards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [materialId]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (flashcards.length === 0 || loading || error) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Stop page scrolling
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flashcards, currentIndex, loading, error]);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      // Wait for flip transition back before changing content
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 150);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', flexGrow: 1 }}>
        <Loader className="spinner" size={32} style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>AI is preparing study deck...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.03)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>{error}</p>
        <button className="secondary-btn" onClick={fetchFlashcards}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p>No flashcards could be generated from this text.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try uploading a file with more structured explanations.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  // Download flashcards as JSON file
  const downloadFlashcards = () => {
    const exportData = {
      materialId,
      exportedAt: new Date().toISOString(),
      totalCards: flashcards.length,
      flashcards: flashcards.map((card, i) => ({
        index: i + 1,
        question: card.question,
        answer: card.answer,
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyai-flashcards-${materialId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flashcards-container">
      {/* Toolbar row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {flashcards.length} cards generated
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-btn" onClick={fetchFlashcards} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
            <RefreshCw size={13} /> Regenerate
          </button>
          <button className="secondary-btn" onClick={downloadFlashcards} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
            <Download size={13} /> Download JSON
          </button>
        </div>
      </div>
      <div className="flashcard-stage">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Face */}
          <div className="card-face front">
            <span className="card-label">Question</span>
            <p className="card-text">{currentCard?.question}</p>
            <span className="flashcard-tip" style={{ marginTop: '24px', opacity: 0.6, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HelpCircle size={12} /> Click card or press Space to reveal answer
            </span>
          </div>

          {/* Back Face */}
          <div className="card-face back">
            <span className="card-label">Answer</span>
            <p className="card-text">{currentCard?.answer}</p>
            <span className="flashcard-tip" style={{ marginTop: '24px', opacity: 0.6, fontSize: '0.75rem' }}>
              Click to flip back
            </span>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <button 
          className="card-nav-btn" 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.3 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
          aria-label="Previous card"
        >
          <ArrowLeft size={20} />
        </button>

        <span className="card-counter">
          {currentIndex + 1} / {flashcards.length}
        </span>

        <button 
          className="card-nav-btn" 
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          style={{ opacity: currentIndex === flashcards.length - 1 ? 0.3 : 1, cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer' }}
          aria-label="Next card"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flashcard-tip" style={{ opacity: 0.5 }}>
        Tip: Use <strong>Left / Right arrows</strong> to navigate and <strong>Spacebar</strong> to flip cards.
      </div>
      
    </div>
  );
}
