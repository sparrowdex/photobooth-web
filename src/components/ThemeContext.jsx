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
      // Dark mode - Red theme
      primary: 'red',
      primaryLight: 'red-400',
      primaryDark: 'red-600',
      primaryHover: 'red-500',
      primaryGradient: 'from-red-500 to-red-700',
      primaryGradientHover: 'from-red-600 to-red-800',
      background: 'bg-gradient-to-br from-gray-900 via-red-900 to-pink-900',
      card: 'bg-amber-50',
      text: 'text-red-800 font-bold',
      textSecondary: 'text-red-600',
      border: 'border-red-500',
      borderLight: 'border-red-200',
      button: 'bg-red-500 hover:bg-red-600',
      buttonSecondary: 'bg-red-100 text-red-600 hover:bg-red-200',
      animatedBg: 'animated-red-bg',
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