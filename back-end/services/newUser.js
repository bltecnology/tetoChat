import bcrypt from 'bcryptjs';
import pool from './database.js';

const saltRounds = 10;

export const addUser = async (req, res) => {
  const { name, email, password, position_id, department_id } = req.body;

  // Verifique se todos os campos obrigatórios estão presentes
  if (!name || !email || !password || !position_id || !department_id) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  try {
    // Criptografe a senha
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Verifique se o departamento existe
    const [departmentRow] = await pool.query("SELECT id FROM departments WHERE id = ?", [department_id]);
    if (departmentRow.length === 0) {
      return res.status(404).send('Departamento não encontrado');
    }

    // Verifique se a posição existe
    const [positionRow] = await pool.query("SELECT id FROM positions WHERE id = ?", [position_id]);
    if (positionRow.length === 0) {
      return res.status(404).send('Posição não encontrada');
    }

    // Insira o usuário na tabela
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, position_id, department_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, position_id, department_id]
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
};
