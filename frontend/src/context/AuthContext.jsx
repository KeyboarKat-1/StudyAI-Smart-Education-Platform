import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  isFirebaseAvailable, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(!isFirebaseAvailable);

  // Handle Auth state changes
  useEffect(() => {
    if (isFirebaseAvailable && auth) {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            setAuthToken(token);
            localStorage.setItem('studyai_token', token);
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              photoURL: firebaseUser.photoURL
            });
          } catch (e) {
            console.error("Error retrieving ID token:", e);
          }
        } else {
          setCurrentUser(null);
          setAuthToken(null);
          localStorage.removeItem('studyai_token');
        }
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Local Fallback Mode
      const localSession = localStorage.getItem('studyai_local_session');
      if (localSession) {
        try {
          const sessionData = JSON.parse(localSession);
          setCurrentUser(sessionData.user);
          setAuthToken(sessionData.token);
        } catch (e) {
          localStorage.removeItem('studyai_local_session');
        }
      }
      setLoading(false);
    }
  }, []);

  // --- Authentication methods ---

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isFirebaseAvailable && auth) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Local Mock Login
        const mockToken = `mock-uid:${email}`;
        const displayName = email.split('@')[0].toUpperCase();
        const userPayload = {
          uid: `local-user-${hashString(email)}`,
          email,
          displayName
        };
        const session = { token: mockToken, user: userPayload };
        localStorage.setItem('studyai_local_session', JSON.stringify(session));
        localStorage.setItem('studyai_token', mockToken);
        setAuthToken(mockToken);
        setCurrentUser(userPayload);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    setLoading(true);
    try {
      if (isFirebaseAvailable && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // Force refresh user profile state
        const token = await userCredential.user.getIdToken(true);
        setAuthToken(token);
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          photoURL: userCredential.user.photoURL
        });
      } else {
        // Local Mock Register
        const mockToken = `mock-uid:${email}`;
        const userPayload = {
          uid: `local-user-${hashString(email)}`,
          email,
          displayName: displayName || email.split('@')[0]
        };
        const session = { token: mockToken, user: userPayload };
        localStorage.setItem('studyai_local_session', JSON.stringify(session));
        localStorage.setItem('studyai_token', mockToken);
        setAuthToken(mockToken);
        setCurrentUser(userPayload);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseAvailable && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('studyai_local_session');
        localStorage.removeItem('studyai_token');
        setCurrentUser(null);
        setAuthToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    if (isFirebaseAvailable && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Mock reset password delay
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`Local fallback password reset mail sent to ${email}`);
    }
  };

  // Helper hash function for deterministic local user IDs
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  const value = {
    currentUser,
    authToken,
    loading,
    isLocalMode,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
