import bcrypt from 'bcryptjs';
import pool from './database.js';

const saltRounds = 10;

export const addUser = async (req, res) => {
  const { name, email, password, position, department } = req.body;

if (!name || !email || !password || !position || !department) {
  return res.status(400).send('Todos os campos são obrigatórios');
}

try {
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const [departmentRow] = await pool.query("SELECT name FROM departments WHERE id = ?", [department]);
  if (departmentRow.length === 0) {
    return res.status(404).send('Departamento não encontrado');
  }

  const queueTableName = `queueOf${departmentRow[0].name}`;

  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, position, department, queue_table_name) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, position, department, queueTableName]
  );

  const insertId = result.insertId;

  // Criar uma tabela `chat` exclusiva para o usuário recém-criado
  const chatTableName = `chat_user_${insertId}`;
  const createChatTableQuery = `
    CREATE TABLE IF NOT EXISTS ${chatTableName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contact_id INT NOT NULL,
      conversation_id INT NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )
  `;
  await pool.query(createChatTableQuery);

  res.status(201).send(`Usuário adicionado com sucesso. ID: ${insertId}`);
} catch (error) {
  console.error('Erro ao salvar usuário:', error);
  res.status(500).send('Erro ao salvar usuário');
}
}