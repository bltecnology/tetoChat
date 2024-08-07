// src/routes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login';
import Home from './pages/home';
import ConnectedDevices from './pages/connectedDevices';
import Contacts from './pages/contacts';
import Account from './pages/account';
import Chat from './pages/chat';
import Users from './pages/users';
import Departments from './pages/departments';
import Positions from './pages/positions';
import QuickResponses from './pages/quickResponses'

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/connectedDevices" element={<ConnectedDevices />} />
        <Route path="/account" element={<Account />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/users" element={<Users />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/quickResponses" element={<QuickResponses />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
