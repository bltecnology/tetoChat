import { createPool, Pool } from 'mysql2/promise';

// Utilize dotenv para carregar as variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

const pool: Pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDB = async () => {
  return pool.getConnection();
};

export default connectDB;
