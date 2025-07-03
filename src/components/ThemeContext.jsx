import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('photobooth-theme');
    if (saved) {
      return saved === 'dark';
    }
    // Default to light mode
    return false;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('photobooth-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      // Dark mode - Blue theme
      primary: 'blue',
      primaryLight: 'blue-400',
      primaryDark: 'blue-600',
      primaryHover: 'blue-500',
      primaryGradient: 'from-blue-500 to-blue-700',
      primaryGradientHover: 'from-blue-600 to-blue-800',
      background: 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900',
      card: 'bg-amber-50',
      text: 'text-blue-800 font-bold',
      textSecondary: 'text-blue-600',
      border: 'border-blue-500',
      borderLight: 'border-blue-200',
      button: 'bg-blue-500 hover:bg-blue-600',
      buttonSecondary: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      animatedBg: 'animated-blue-bg',
      overlay: 'bg-white',
      shadow: 'shadow-2xl',
    } : {
      // Light mode - Pink theme
      primary: 'pink',
      primaryLight: 'pink-400',
      primaryDark: 'pink-600',
      primaryHover: 'pink-500',
      primaryGradient: 'from-pink-400 to-pink-600',
      primaryGradientHover: 'from-pink-500 to-pink-700',
      background: 'bg-gradient-to-br from-pink-300 via-purple-200 to-indigo-200',
      card: 'bg-white',
      text: 'text-pink-600',
      textSecondary: 'text-pink-400',
      border: 'border-pink-500',
      borderLight: 'border-pink-200',
      button: 'bg-pink-500 hover:bg-pink-600',
      buttonSecondary: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
      animatedBg: 'animated-pink-bg',
      overlay: 'bg-white',
      shadow: 'shadow-2xl',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 