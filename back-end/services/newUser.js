import bcrypt from 'bcrypt';
import pool from './database.js';

const saltRounds = 10;

export const addUser = async (req, res) => {
  const { name, email, password, position, department } = req.body;

  if (!name || !email || !password || !position || !department) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, position, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, position, department]
    );

    const insertId = (result).insertId;
    res.status(201).send(`Usuário adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).send('Erro ao salvar usuário');
  }
};
