import express from 'express';
import { loginUser } from '../controllers/loginController.js';

const loginRoutes = express.Router();

// Rota de login
loginRoutes.post('/login', loginUser);

export { loginRoutes };
