import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('nexly_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (err) {
        localStorage.removeItem('nexly_user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexly_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    setUser,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
