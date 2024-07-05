// src/routes.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login';
import Home from './pages/home';
import Tags from './pages/tags';
import ConnectedDevices from './pages/connectedDevices';
import Contacts from './pages/contacts';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/connectedDevices" element={<ConnectedDevices />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
