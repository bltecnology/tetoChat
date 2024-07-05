// src/App.tsx
import React from 'react';
require('dotenv').config();
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
