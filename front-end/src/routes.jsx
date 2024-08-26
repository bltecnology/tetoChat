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
import QuickResponses from './pages/quickResponses';
import PrivateRoute from './components/privateRoute';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rotas protegidas */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <Contacts />
            </PrivateRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <PrivateRoute>
              <Departments />
            </PrivateRoute>
          }
        />
        <Route
          path="/connectedDevices"
          element={
            <PrivateRoute>
              <ConnectedDevices />
            </PrivateRoute>
          }
        />
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/positions"
          element={
            <PrivateRoute>
              <Positions />
            </PrivateRoute>
          }
        />
        <Route
          path="/quickResponses"
          element={
            <PrivateRoute>
              <QuickResponses />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
