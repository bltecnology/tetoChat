import jwt from 'jsonwebtoken';
import pool from './db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('A SECRET_KEY deve ser definida nas variáveis de ambiente');
}

// Função para autenticar usuário e gerar o token JWT
export const authenticateUser = async (req, res) => {
  const { email, password } = req.body;

  // Verifica se email e senha foram fornecidos
  if (!email || !password) {
    return res.status(400).send('Email e senha são obrigatórios');
  }

  try {
    // Busca o usuário pelo email
    const [rows] = await pool.execute(
      `SELECT users.*, departments.id AS department_id, departments.name AS department_name 
       FROM users 
       INNER JOIN departments ON users.department_id = departments.id 
       WHERE users.email = ?`, 
       [email]
    );
    
    
        const user = rows[0];

    // Verifica se o usuário foi encontrado
    if (!user) {
      return res.status(401).send('Credenciais inválidas');
    }

    // Compara a senha fornecida com a senha armazenada no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Credenciais inválidas');
    }

    // Verifica se a chave secreta está presente
    console.log("Chave secreta ao gerar token:", process.env.SECRET_KEY);

    // Gera o token JWT com o ID e email do usuário
    const token = jwt.sign({ id: user.id, email: user.email, department:user.department_name }, process.env.SECRET_KEY, { expiresIn: '1h' });
    const department = user.department_name
    // Retorna o token gerado
    res.json({ token, department});
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    res.status(500).send('Erro ao tentar fazer login');
  }
};

// Middleware para autenticar o token JWT
export const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do header "Authorization"
  
  // Loga o token recebido e a chave secreta para verificação
  // console.log("Token recebido:", token);
  // console.log("Chave secreta ao verificar:", process.env.SECRET_KEY);

  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).send('Token não fornecido'); // Token ausente
  }

  // Verifica o token JWT
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Erro ao verificar o token:', err); // Log de erro detalhado
      if (err.name === 'TokenExpiredError') {
        return res.status(403).send('Token expirado'); // Token expirado
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).send('Token inválido'); // Token inválido
      }
      return res.status(403).send('Erro ao verificar token'); // Outro erro
    }

    // Armazena as informações do usuário decodificado no req.user
    req.user = user;
    next(); // Continua para a próxima função (controller da rota)
  });
};
