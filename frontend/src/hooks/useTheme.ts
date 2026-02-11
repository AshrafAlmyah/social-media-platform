import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      // Default to dark theme if no preference saved
      return (saved as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('light-theme', 'dark-theme');
    // Add current theme class (dark is default, so only add light-theme when needed)
    if (theme === 'light') {
      root.classList.add('light-theme');
    }
    // Dark theme is default (no class needed)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Initialize theme on mount - ensure dark is default
  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme') as Theme;
    const initialTheme = saved || 'dark'; // Default to dark
    
    root.classList.remove('light-theme', 'dark-theme');
    if (initialTheme === 'light') {
      root.classList.add('light-theme');
    }
    // Dark theme is the default, no class needed
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}

