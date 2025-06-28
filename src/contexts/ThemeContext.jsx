import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultPreferences = {
  theme: 'system',
  compactView: false,
  sidebarCollapsed: false,
  notifications: true,
  serviceNowConnected: false,
};

export const ThemeProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nexly_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      let shouldBeDark = false;

      if (preferences.theme === 'dark') {
        shouldBeDark = true;
      } else if (preferences.theme === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferences.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
  };

  const updatePreferences = (newPrefs) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('nexly_preferences', JSON.stringify(updated));
  };

  const value = {
    isDark,
    preferences,
    toggleTheme,
    updatePreferences,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
