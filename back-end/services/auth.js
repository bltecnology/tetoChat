import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './database.js';

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('A SECRET_KEY deve ser definida nas variáveis de ambiente');
}

// Função de login (autenticação do usuário)
export const authenticateUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email e senha são obrigatórios');
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).send('Credenciais inválidas');
    }

    // Gera o token JWT com id e email
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    // Retorna o token
    res.json({ token });
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    res.status(500).send('Erro ao tentar fazer login');
  }
};

// Middleware para autenticar usando JWT
export const authenticateJWT = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Não autorizado
  }

  // Verifica o token
  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.sendStatus(403); // Proibido
    }

    try {
      // Busca o usuário completo no banco de dados
      const [rows] = await pool.execute('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id]);
      const user = rows[0];

      if (!user) {
        return res.status(404).send('Usuário não encontrado');
      }

      // Anexa o usuário completo ao req
      req.user = user;

      // Continua para a próxima função
      next();
    } catch (error) {
      console.error('Erro ao buscar usuário no banco:', error);
      res.status(500).send('Erro ao buscar usuário no banco');
    }
  });
};
