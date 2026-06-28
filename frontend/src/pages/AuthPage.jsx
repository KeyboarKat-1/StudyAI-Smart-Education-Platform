import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { login, register, isLocalMode } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error(err);
      // Simplify Firebase error messages
      let friendlyMessage = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account already exists with this email.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glassmorphism">
        
        {isLocalMode && (
          <div className="fallback-badge" style={{ position: 'absolute', top: 16, right: 16, margin: 0 }}>
            <AlertTriangle size={14} />
            Local Mode (No DB Configured)
          </div>
        )}

        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">
              <BookOpen size={24} color="#fff" />
            </div>
          </div>
          <h2 className="gradient-text">StudyAI</h2>
          <p>Your intelligent full-stack study companion</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            color: 'var(--color-accent)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {isLocalMode && !isRegister && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            color: 'var(--color-warning)',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'center',
            lineHeight: 1.4
          }}>
            <strong>Instant Access:</strong> Any email and password will work in Local Mode!
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label htmlFor="displayName">Name</label>
              <input
                id="displayName"
                type="text"
                placeholder="John Doe"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="glow-btn"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderThickness: '2px' }} />
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="auth-toggle-link">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(''); }}>
                Sign In
              </a>
            </>
          ) : (
            <>
              New to StudyAI?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(''); }}>
                Create Account
              </a>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
