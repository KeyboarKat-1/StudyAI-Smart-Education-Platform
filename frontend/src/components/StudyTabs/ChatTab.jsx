import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Send, Sparkles, MessageSquare, Loader } from 'lucide-react';

export default function ChatTab({ materialId, documentName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize messages on material change
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hi! I am your StudyAI assistant. I've finished analyzing **${documentName}**. You can ask me questions about its content, request explanations, or check definitions. What would you like to learn today?`
      }
    ]);
  }, [materialId, documentName]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input.trim();
    if (!query || sending) return;

    setInput('');
    setSending(true);

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);

    try {
      // Map message roles for API history format (needs 'user' and 'assistant')
      const history = updatedMessages
        .slice(1, -1) // Exclude welcome message and the newly added user message
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await api.sendChatMessage(materialId, query, history);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `⚠️ Failed to get reply from AI: ${err.message || 'Check your connections.'}` 
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    "Summarize the main topic",
    "Identify key definitions",
    "Explain this to a beginner"
  ];

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.role}`}>
            {msg.content.split('\n\n').map((para, pIdx) => {
              if (para.startsWith('>')) {
                return (
                  <blockquote key={pIdx}>
                    {para.substring(1).trim()}
                  </blockquote>
                );
              }
              if (para.startsWith('```')) {
                const codeText = para.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
                return (
                  <pre key={pIdx}>
                    <code>{codeText}</code>
                  </pre>
                );
              }
              return <p key={pIdx}>{para}</p>;
            })}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader className="spinner" size={16} />
            <span>AI is reviewing document...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ marginTop: '16px' }}>
        {messages.length === 1 && !sending && (
          <div className="suggestions-box">
            {suggestions.map((sug, idx) => (
              <button 
                key={idx}
                className="suggestion-chip"
                onClick={() => handleSend(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        )}
        
        <form 
          className="chat-input-area"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            placeholder={`Ask a question about "${documentName}"...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={sending || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
