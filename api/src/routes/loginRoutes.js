import express from 'express';
import { authenticateUser } from '../models/auth.js';

const loginRoutes = express.Router();

// Rota de login
loginRoutes.post('/login', authenticateUser);

export { loginRoutes };
