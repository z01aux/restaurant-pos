import React, { useState, useEffect } from 'react';
import RestaurantPOS from './components/RestaurantPOS';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Guardar tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Actualizar theme-color del navegador
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const newColor = isDarkMode ? '#030712' : '#ffffff';
      metaThemeColor.setAttribute('content', newColor);
    }
  }, [isDarkMode]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return <RestaurantPOS isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
};

export default App;