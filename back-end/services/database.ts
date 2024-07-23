import { createPool, Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();
console.log('DB_HOST:', process.env.DB_HOST);
// Criar um pool de conexões com o banco de dados
const pool: Pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
