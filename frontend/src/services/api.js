const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('studyai_token');
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      localStorage.removeItem('studyai_token');
      localStorage.removeItem('studyai_local_session');
      window.dispatchEvent(new Event('auth_state_invalid'));
      throw new Error('Session expired. Please log in again.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Materials
  uploadMaterial: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/materials/upload', {
      method: 'POST',
      body: formData
    });
  },
  
  listMaterials: () => request('/materials'),
  
  getMaterial: (id) => request(`/materials/${id}`),
  
  deleteMaterial: (id) => request(`/materials/${id}`, {
    method: 'DELETE'
  }),
  
  // AI Operations
  getSummary: (materialId) => request('/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  
  getFlashcards: (materialId) => request('/ai/flashcards', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  
  getQuiz: (materialId, quizType = 'mcq') => request('/ai/quiz', {
    method: 'POST',
    body: JSON.stringify({ materialId, quizType })
  }),
  
  evaluateShortAnswer: (question, sampleAnswer, userAnswer) => request('/ai/quiz/evaluate', {
    method: 'POST',
    body: JSON.stringify({ question, sampleAnswer, userAnswer })
  }),
  
  getStudySchedule: (materialId) => request('/ai/schedule', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  
  getWeakTopicsReport: (materialId) => request('/ai/weak-topics', {
    method: 'POST',
    body: JSON.stringify({ materialId })
  }),
  
  sendChatMessage: (materialId, message, history) => request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ materialId, message, history })
  }),

  // Analytics Endpoints
  getDashboardStats: () => request('/analytics/dashboard'),
  
  getQuizHistory: () => request('/analytics/quiz-history'),
  
  saveQuizRecord: (record) => request('/analytics/quiz-history', {
    method: 'POST',
    body: JSON.stringify(record)
  }),
  
  logActivity: (description) => request('/analytics/activity', {
    method: 'POST',
    body: JSON.stringify({ description })
  })
};
