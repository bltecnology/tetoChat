// src/App.tsx
import React from 'react';
import './index.css';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
};

export default App;
