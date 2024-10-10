import jwt from 'jsonwebtoken';
import pool from './db.js';
import bcrypt from 'bcrypt'; // Para comparar senhas com hash

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('A SECRET_KEY deve ser definida nas variáveis de ambiente');
}

// Função para autenticar usuário e gerar o token JWT
export const authenticateUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email e senha são obrigatórios');
  }

  try {
    // Verifica se o usuário existe no banco de dados
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).send('Credenciais inválidas');
    }

    // Verifica a senha usando bcrypt (caso a senha esteja criptografada no banco)
    const isPasswordValid = await bcrypt.compare(password, user.password); // Assume que a senha no banco está criptografada

    if (!isPasswordValid) {
      return res.status(401).send('Credenciais inválidas');
    }

    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    res.status(500).send('Erro ao tentar fazer login');
  }
};

// Middleware para autenticar o token JWT
export const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do header "Authorization"

  if (!token) {
    return res.sendStatus(401); // Token não fornecido
  }

  // Verifica o token JWT
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Token inválido ou expirado
    }

    req.user = user; // Armazena as informações do usuário decodificado no req.user
    next(); // Continua para a próxima função (controller da rota)
  });
};
