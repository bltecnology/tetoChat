import { createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port:8006,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const executeSQLFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const statements = sql.split(';').filter(statement => statement.trim() !== '');
  
  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      console.error('Erro ao executar statement:', statement, error);
    }
  }
};

const initDB = async () => {
  const schemaPath = path.join('.', 'schemas.sql');
  await executeSQLFile(schemaPath);
  console.log('Tabelas criadas ou já existentes.');
};

initDB().catch(error => {
  console.error('Erro ao inicializar o banco de dados:', error);
});

export default pool;
