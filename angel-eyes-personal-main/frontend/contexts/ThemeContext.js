import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
  isDarkMode,
  toggleTheme,
  colors: {
    // Light Mode
    light: {
      primary: '#6a1b9a', // Angel Eyes purple
      secondary: '#512da8',
      accent: '#673ab7',
      background: '#ffffff',
      surface: '#f9f9f9',
      text: '#1a1a1a',
      textSecondary: '#4f4f4f',
      border: '#e0e0e0',
      overlay: '#ffffff',
      cardBackground: '#f3f0fa',
      buttonBackground: '#6a1b9a',
      buttonText: '#ffffff',
      inputBackground: '#ffffff',
      shadowColor: '#000000',
      screenBackground: '#fefefe',
    },

    // Dark Mode
    dark: {
      primary: '#bb86fc',
      secondary: '#b388ff',
      accent: '#e0b3ff',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#444444',
      overlay: '#1c1c1c',
      cardBackground: '#222030',
      buttonBackground: '#bb86fc',
      buttonText: '#121212',
      inputBackground: '#2d2d2d',
      shadowColor: '#000000',
      screenBackground: '#1a1a2e',
    },
  }
};

  const currentColors = isDarkMode ? theme.colors.dark : theme.colors.light;

  return (
    <ThemeContext.Provider value={{ ...theme, currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
};