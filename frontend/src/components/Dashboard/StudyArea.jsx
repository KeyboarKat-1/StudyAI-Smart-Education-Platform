import React, { useState, useEffect } from 'react';
import ChatTab from '../StudyTabs/ChatTab';
import SummaryTab from '../StudyTabs/SummaryTab';
import FlashcardsTab from '../StudyTabs/FlashcardsTab';
import QuizTab from '../StudyTabs/QuizTab';
import ScheduleTab from '../StudyTabs/ScheduleTab';
import WeakTopicsTab from '../StudyTabs/WeakTopicsTab';
import { MessageSquare, FileText, Layers, Award, Sparkles, Calendar, AlertTriangle } from 'lucide-react';

export default function StudyArea({ selectedMaterial, initialTabId }) {
  const [activeTab, setActiveTab] = useState('chat');

  // Reset tab to chat when material changes, unless an initial tab is forwarded
  useEffect(() => {
    setActiveTab(initialTabId || 'chat');
  }, [selectedMaterial?.id, initialTabId]);

  if (!selectedMaterial) {
    return (
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        padding: '40px',
        textAlign: 'center',
        background: 'rgba(11, 15, 23, 0.4)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Sparkles size={36} />
        </div>
        <h2 className="gradient-text" style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Interactive Study Hub</h2>
        <p style={{ maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Select an uploaded document from the sidebar or import a new one to unlock summaries, practice quizzes, interactive flashcards, and document chat.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', label: 'Document Chat', icon: <MessageSquare size={14} /> },
    { id: 'summary', label: 'Summary', icon: <FileText size={14} /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={14} /> },
    { id: 'quiz', label: 'Quiz Mode', icon: <Award size={14} /> },
    { id: 'schedule', label: '7-Day Plan', icon: <Calendar size={14} /> },
    { id: 'weak_topics', label: 'Weak Topics', icon: <AlertTriangle size={14} /> }
  ];

  return (
    <div className="study-area">
      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === 'chat' && (
          <ChatTab 
            materialId={selectedMaterial.id} 
            documentName={selectedMaterial.name} 
          />
        )}
        {activeTab === 'summary' && (
          <SummaryTab 
            materialId={selectedMaterial.id} 
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab 
            materialId={selectedMaterial.id} 
          />
        )}
        {activeTab === 'quiz' && (
          <QuizTab 
            materialId={selectedMaterial.id} 
            documentName={selectedMaterial.name}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab 
            materialId={selectedMaterial.id} 
            documentName={selectedMaterial.name}
          />
        )}
        {activeTab === 'weak_topics' && (
          <WeakTopicsTab 
            materialId={selectedMaterial.id} 
            documentName={selectedMaterial.name}
          />
        )}
      </div>
    </div>
  );
}
