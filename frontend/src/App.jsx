import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { Loader } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        color: 'var(--text-secondary)'
      }}>
        <Loader className="spinner" size={40} style={{ marginBottom: '16px' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Synchronizing Session</h2>
      </div>
    );
  }

  return currentUser ? <DashboardPage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
