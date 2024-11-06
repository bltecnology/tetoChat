import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db.js';

// Segredo usado para gerar o token JWT
const JWT_SECRET = 'seuSegredoAqui'; // Certifique-se de armazenar isso em variáveis de ambiente no futuro

// Controller para login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Verificar se o email e a senha foram enviados
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    // Buscar o usuário pelo email
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = rows[0];

    // Comparar a senha criptografada
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // Gerar o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h', // O token expira em 1 hora
    });

    // Enviar o token e informações básicas do usuário
    //res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    // Backend (loginUser controller)
    res.status(200).json({ token, department: user.department, id: user.id });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao tentar fazer login' });
  }
};
