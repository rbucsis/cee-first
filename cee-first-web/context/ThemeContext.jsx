'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('spring-light');

  useEffect(() => {
    // 1. Read saved theme from localStorage, or default to current month's season
    const savedTheme = localStorage.getItem('cee_theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Auto-detect season based on month
      const month = new Date().getMonth(); // 0-11
      let defaultSeason = 'spring-light';
      if (month >= 5 && month <= 7) defaultSeason = 'summer-light';
      else if (month >= 8 && month <= 10) defaultSeason = 'fall-light';
      else if (month === 11 || month <= 1) defaultSeason = 'winter-light';

      setTheme(defaultSeason);
      document.documentElement.setAttribute('data-theme', defaultSeason);
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('cee_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);