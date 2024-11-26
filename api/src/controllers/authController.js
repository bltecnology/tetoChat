import jwt from 'jsonwebtoken';

const JWT_SECRET = 'seuSegredoAqui'; // Replace this with an environment variable

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adiciona os dados decodificados ao objeto req
    next(); // Passa para o próximo middleware ou rota
  } catch (err) {
    console.error('Erro ao verificar token:', err);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};
