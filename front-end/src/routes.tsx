// src/routes.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login';
import Home from './pages/home';
import ConnectedDevices from './pages/connectedDevices';
import Contacts from './pages/contacts';
import Account from './pages/account';
import Chat from './pages/chat';
import Departamentos from './pages/departamentos';
import Users from './pages/user';


const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/Departamentos" element={<Departamentos />} />
        <Route path="/connectedDevices" element={<ConnectedDevices />} />
        <Route path="/account" element={<Account />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
