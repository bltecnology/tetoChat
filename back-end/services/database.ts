import { createConnection, Connection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<Connection> => {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  return connection;
};

export default connectDB;
