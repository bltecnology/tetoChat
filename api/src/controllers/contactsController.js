import pool from '../models/db.js';

export const addContact = async (req, res) => {
  let { name, phone, tag, note, cpf, rg, email } = req.body;
  if (!name || !phone) {
    return res.status(400).send("Nome e telefone são obrigatórios");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, phone, tag, note, cpf, rg, email]
    );
    const insertId = result.insertId;
    res.status(201).send(`Contato adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    res.status(500).send("Erro ao salvar contato");
  }
};

export const getContacts = async (req, res) => {
  try {
    const [contacts] = await pool.query("SELECT * FROM contacts");
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).send("Erro ao buscar contatos");
  }
};

export const deleteContact = async (req, res) => {
  const contactId = req.params.id;
  try {
    const [result] = await pool.query("DELETE FROM contacts WHERE id = ?", [
      contactId,
    ]);
    if (result.affectedRows > 0) {
      res.status(200).send("Contato deletado com sucesso");
    } else {
      res.status(404).send("Contato não encontrado");
    }
  } catch (error) {
    console.error("Erro ao deletar contato:", error);
    res.status(500).send("Erro ao deletar contato");
  }
};

export const getUserChats = async (req, res) => {
  const department = req.params.department;

  try {
    // Use parameterized query with `?` to safely include the department value
    const [contacts] = await pool.query(
      `SELECT * FROM contacts WHERE status = ?`,
      [department]
    );
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Erro ao buscar contatos do chat:", error);
    res.status(500).send("Erro ao buscar contatos do chat");
  }
};

export const getStage = async (req, res) => {
  const contactId = req.params.id;
  if (!contactId) {
    return res.status(400).send("Id não pode ser vazio!");
  }
  try {
    const [result] = await pool.query(
      "SELECT stage FROM contacts WHERE id = ?",
      [contactId]
    );

    if (result.length === 0) {
      return res.status(404).send("Contato não encontrado");
    }

    return res.status(200).send(JSON.stringify(result[0]));
  } catch (error) {
    console.error("Erro ao buscar stage:", error);
    res.status(500).send("Erro ao buscar stage");
  }
};

export const updateStage = async (req, res) => {
  const contactId = req.params.id;
  const stage = req.query.stage;
  if (!stage) {
    return res.status(400).send("Stage não pode ser vazio!");
  } else {
    if (!contactId) {
      return res.status(400).send("Id não pode ser vazio!");
    }
  }
  try {
      await pool.query(
        "UPDATE contacts SET stage = ? where id = ?",
        [stage, contactId]
      );
      res.status(200).send(`Stage atualizado com sucesso.`);
  } catch (error) {
      console.error("Erro ao aualizar stage:", error);
      res.status(500).send("Erro ao stage");
  }
};