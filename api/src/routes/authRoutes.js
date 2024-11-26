import express from 'express';
import { authenticateJWT } from '../models/auth.js';

const authRoutes = express.Router();

// Route to confirm the token
authRoutes.get('/confirm-token', authenticateJWT, (req, res) => {
  res.status(200).json({ message: 'Token válido', user: req.user });
});

export { authRoutes };
