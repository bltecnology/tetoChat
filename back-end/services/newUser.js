import bcrypt from 'bcryptjs';
import pool from './database.js';

const saltRounds = 10;

export const addUser = async (req, res) => {
  const { name, email, password, position, department } = req.body;

  if (!name || !email || !password || !position || !department) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  try {
    // Hash da senha do usuário
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir o usuário na tabela `users`
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, position, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, position, department]
    );

    const userId = result.insertId;

    // Criar a tabela de chat exclusiva para o novo usuário
    const chatTableName = `chat_user_${userId}`;
    const createChatTableQuery = `
      CREATE TABLE IF NOT EXISTS ${chatTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        conversation_id INT NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )
    `;
    await pool.query(createChatTableQuery);

    res.status(201).send(`Usuário adicionado com sucesso. ID: ${userId}`);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).send('Erro ao salvar usuário');
  }
};
