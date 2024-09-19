import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database';

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('A SECRET_KEY deve ser definida nas variáveis de ambiente');
}

export const authenticateUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email e senha são obrigatórios');
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !password) {
      return res.status(401).send('Credenciais inválidas');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    res.status(500).send('Erro ao tentar fazer login');
  }
};

export const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

      req.user = user;

    //  res.json({ user });

    next();
  });
};
