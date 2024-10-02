import React, { useEffect } from 'react';
import './index.css';
import AppRoutes from './routes';
import { BrowserRouter } from 'react-router-dom';

const App = () => {
  useEffect(() => {
    const handleUnload = () => {
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
      <BrowserRouter> 
      <AppRoutes />
      </BrowserRouter>
  );
};

export default App;
