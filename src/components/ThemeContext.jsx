import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      // Light mode - Pink theme only
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
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 