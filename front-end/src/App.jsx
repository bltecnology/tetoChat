import React, { useEffect } from 'react';

import './index.css';
import AppRoutes from './routes';

const App = () => {
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem('token'); // Remove o token do localStorage ao fechar a aba
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
};

export default App;
