
import pool from '../models/db.js';


export const getMessages = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM messages");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).send("Erro ao buscar mensagens");
  }
};


export const addMessage = async (req, res) => {
  const { userId, message, contactId } = req.body;
  if (!userId || !message || !contactId) {
    return res.status(400).send("Usuário, mensagem e contato são obrigatórios");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO messages (userId, message, contactId) VALUES (?, ?, ?)",
      [userId, message, contactId]
    );
    res.status(201).send(`Mensagem adicionada com sucesso. ID: ${result.insertId}`);
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    res.status(500).send("Erro ao adicionar mensagem");
  }
};

export const deleteMessage = async (req, res) => {
  const messageId = req.params.id;

  try {
    const [result] = await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);
    if (result.affectedRows > 0) {
      res.status(200).send("Mensagem deletada com sucesso");
    } else {
      res.status(404).send("Mensagem não encontrada");
    }
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error);
    res.status(500).send("Erro ao deletar mensagem");
  }
};
