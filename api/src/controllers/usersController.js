import bcrypt from 'bcryptjs';
import pool from '../models/db.js';

const saltRounds = 10;

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).send("Erro ao buscar usuários");
  }
};

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, position, department } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (user.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    const updatedUser = {
      name: name || user[0].name,
      email: email || user[0].email,
      position: position || user[0].position,
      department: department || user[0].department,
    };

    if (password) {
      updatedUser.password = password;
    }

    await pool.query("UPDATE users SET ? WHERE id = ?", [updatedUser, userId]);

    res.status(200).send("Usuário atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário");
  }
};

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