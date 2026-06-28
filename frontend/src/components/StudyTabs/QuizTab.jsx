import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Check, X, RefreshCw, AlertCircle, HelpCircle, BookOpen, FileText, ChevronRight, Loader } from 'lucide-react';

export default function QuizTab({ materialId, documentName }) {
  const [quizType, setQuizType] = useState(null); // mcq, tf, short_answer
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Short Answer specific states
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [saEvaluation, setSaEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartQuiz = async (type) => {
    setQuizType(type);
    setLoading(true);
    setError('');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShortAnswerText('');
    setSaEvaluation(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    
    try {
      const data = await api.getQuiz(materialId, type);
      setQuizQuestions(data.quiz || []);
    } catch (err) {
      setError(err.message || `Failed to generate practice quiz.`);
      setQuizType(null); // Go back to selector
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctIndex) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleSubmitShortAnswer = async () => {
    if (!shortAnswerText.trim() || evaluating || isAnswered) return;
    
    setEvaluating(true);
    setError('');
    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    try {
      const evaluation = await api.evaluateShortAnswer(
        currentQuestion.question,
        currentQuestion.sampleAnswer,
        shortAnswerText
      );
      
      setSaEvaluation(evaluation);
      setIsAnswered(true);
      
      // If score is 6/10 or higher, count as correct for stats
      if (evaluation.score >= 6) {
        setScore(prev => prev + 1);
      }
    } catch (err) {
      setError(`AI evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShortAnswerText('');
    setSaEvaluation(null);
    setIsAnswered(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    setShowResults(true);
    // Save quiz history log to analytics backend
    try {
      await api.saveQuizRecord({
        materialId,
        materialName: documentName,
        score,
        totalQuestions: quizQuestions.length,
        quizType
      });
    } catch (err) {
      console.error("Failed to save quiz history record:", err);
    }
  };

  const handleRestartQuiz = () => {
    setQuizQuestions([]);
    setQuizType(null); // Return to selector screen
    setShowResults(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', flexGrow: 1 }}>
        <Loader className="spinner" size={32} style={{ marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>AI is reading material to construct custom questions...</p>
      </div>
    );
  }

  // 1. Selector Screen (if no type is selected yet)
  if (!quizType) {
    return (
      <div className="quiz-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
        <h2 className="gradient-text" style={{ marginBottom: '8px' }}>Challenge Workspace</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>Select your preferred study evaluation method:</p>
        
        <div className="quiz-type-selector" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="type-select-card glassmorphism" onClick={() => handleStartQuiz('mcq')}>
            <FileText size={32} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <span className="type-select-title">Multiple Choice</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>5 Questions with detailed explanations</p>
          </div>

          <div className="type-select-card glassmorphism" onClick={() => handleStartQuiz('tf')}>
            <Check size={32} color="var(--color-secondary)" style={{ marginBottom: '12px' }} />
            <span className="type-select-title">True / False</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>5 Statements to test fact bounds</p>
          </div>

          <div className="type-select-card glassmorphism" onClick={() => handleStartQuiz('short_answer')}>
            <HelpCircle size={32} color="var(--color-accent)" style={{ marginBottom: '12px' }} />
            <span className="type-select-title">Short Answer</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>3 Conceptual prompts graded by Llama 3.3</p>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '24px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.15)', color: 'var(--color-accent)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // 2. Results Screen
  if (showResults) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    let feedback = 'Keep reviewing summaries to raise score!';
    if (percentage >= 80) feedback = 'Sensational work! You mastered this!';
    else if (percentage >= 50) feedback = 'Good effort! Review the definitions to score higher.';
    
    return (
      <div className="quiz-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
        <div className="quiz-results-card glassmorphism" style={{ width: '480px' }}>
          <h2 className="gradient-text">Quiz Complete</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Accuracy report on '{documentName}'</p>
          
          <div className="quiz-score-circle">
            <span className="quiz-score-num">{score}/{quizQuestions.length}</span>
            <span className="quiz-score-label">{percentage}%</span>
          </div>

          <h3 style={{ marginTop: '12px' }}>{feedback}</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="glow-btn" onClick={() => handleStartQuiz(quizType)}>
              <RefreshCw size={16} /> Retake Quiz
            </button>
            <button className="secondary-btn" onClick={handleRestartQuiz}>
              Select Another Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / quizQuestions.length) * 100;
  const isShortAnswer = quizType === 'short_answer';

  return (
    <div className="quiz-container">
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="quiz-question-card">
        <div className="quiz-question-num">
          {quizType.toUpperCase()} Quiz • Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </div>
        <div className="quiz-question-text">
          {currentQuestion?.question}
        </div>

        {/* Dynamic options or text input based on type */}
        {!isShortAnswer ? (
          
          /* MULTIPLE CHOICE / TRUE-FALSE LAYOUT */
          <div className="quiz-options">
            {currentQuestion?.options.map((option, idx) => {
              let optionClass = '';
              if (isAnswered) {
                if (idx === currentQuestion.correctIndex) {
                  optionClass = 'correct';
                } else if (idx === selectedOption) {
                  optionClass = 'incorrect';
                }
              } else if (idx === selectedOption) {
                optionClass = 'selected';
              }

              return (
                <button
                  key={idx}
                  className={`quiz-option-btn ${optionClass}`}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{option}</span>
                    {isAnswered && idx === currentQuestion.correctIndex && <Check size={16} color="var(--color-success)" />}
                    {isAnswered && idx === selectedOption && idx !== currentQuestion.correctIndex && <X size={16} color="var(--color-accent)" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          
          /* SHORT ANSWER INPUT LAYOUT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea
              className="sa-text-input"
              placeholder="Type your structured explanation answer here..."
              value={shortAnswerText}
              onChange={(e) => setShortAnswerText(e.target.value)}
              disabled={isAnswered || evaluating}
            />
            
            {evaluating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Loader className="spinner" size={16} />
                <span>Llama 3.3 is evaluating your answer details...</span>
              </div>
            )}

            {isAnswered && saEvaluation && (
              <div className="sa-feedback-sheet">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ color: 'var(--text-primary)' }}>AI Diagnostic Report</h4>
                  <span className={`sa-score-badge ${saEvaluation.score >= 8 ? 'excellent' : saEvaluation.score >= 5 ? 'passing' : 'failing'}`}>
                    Score: {saEvaluation.score}/10
                  </span>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Feedback:</strong> {saEvaluation.feedback}
                </p>

                {saEvaluation.missingPoints && saEvaluation.missingPoints.length > 0 && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Missing core topics:</strong>
                    <ul style={{ paddingLeft: '20px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                      {saEvaluation.missingPoints.map((pt, idx) => <li key={idx}>{pt}</li>)}
                    </ul>
                  </div>
                )}

                {saEvaluation.corrections && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>
                    <strong>Corrections:</strong> {saEvaluation.corrections}
                  </p>
                )}

                <div style={{ marginTop: '8px', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', fontSize: '0.85rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reference Model Answer:</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{currentQuestion?.sampleAnswer}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isAnswered && !isShortAnswer && (
          <div className="quiz-explanation-box">
            <h5>Explanation</h5>
            <p>{currentQuestion?.explanation}</p>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', color: 'var(--color-accent)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="quiz-action-row">
          {!isAnswered ? (
            isShortAnswer ? (
              <button 
                className="glow-btn"
                onClick={handleSubmitShortAnswer}
                disabled={!shortAnswerText.trim() || evaluating}
                style={{ opacity: !shortAnswerText.trim() ? 0.5 : 1 }}
              >
                Submit for AI Grading
              </button>
            ) : (
              <button 
                className="glow-btn"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                style={{ opacity: selectedOption === null ? 0.5 : 1 }}
              >
                Submit Answer
              </button>
            )
          ) : (
            <button className="glow-btn" onClick={handleNextQuestion}>
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish & Record Score' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
