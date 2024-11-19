import pool from '../models/db.js';

export const addQuickResponse = async (req, res) => {
  let { text, department } = req.body;
  if (!text) {
    return res.status(400).send("Mensagem não pode ser vazia!");
  } else if(!department) {
    return res.status(400).send("Departamento não pode ser vazio!");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO quick_responses (text, department_id) VALUES (?, ?)",
      [text, department]
    );
    const insertId = result.insertId;
    res.status(201).send(`Mensagem rápida adicionada com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error("Erro ao salvar mensagem rápida:", error);
    res.status(500).send("Erro ao mensagem rápida");
  }
};

export const getQuickResponses = async (req, res) => {
  try {
    const [contacts] = await pool.query("SELECT * FROM quick_responses");
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Erro ao buscar mensagems rápidas:", error);
    res.status(500).send("Erro ao buscar mensagems rápidas");
  }
};

export const deleteQuickResponse = async (req, res) => {
  const quickResponseId = req.params.id;
  try {
    const [result] = await pool.query("DELETE FROM quick_responses WHERE id = ?", [
        quickResponseId,
    ]);
    if (result.affectedRows > 0) {
      res.status(200).send("Mensagem rápida deletado com sucesso");
    } else {
      res.status(404).send("Mensagem rápida não encontrado");
    }
  } catch (error) {
    console.error("Erro ao deletar mensagem rápida:", error);
    res.status(500).send("Erro ao deletar mensagem rápida");
  }
};

export const updateQuickResponse = async (req, res) => {
    const quickResponseId = req.params.id;
    let { text, department } = req.body;
    if (!text) {
        return res.status(400).send("Mensagem não pode ser vazia!");
    } else if(!department) {
        return res.status(400).send("Departamento não pode ser vazio!");
    }
    try {
        const [result] = await pool.query(
          "UPDATE quick_responses SET text = ?, department_id = ? where id = ?",
          [text, department]
        );
        const insertId = result.insertId;
        res.status(201).send(`Mensagem rápida atualizada com sucesso. ID: ${insertId}`);
    } catch (error) {
        console.error("Erro ao aualizar mensagem rápida:", error);
        res.status(500).send("Erro ao mensagem rápida");
    }
};

export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, email, password, position, department } = req.body;
  
    try {
        await pool.query("UPDATE users SET ? WHERE id = ?", [updatedUser, userId]);
      const [user] = await pool.query("UPDATE quick_responses SET  users WHERE id = ?", [
        userId,
      ]);
  
      if (user.length === 0) {
        return res.status(404).send("Usuário não encontrado");
      }
  
      const updatedUser = {
        name: name || user[0].name,
        email: email || user[0].email,
        position_id: position || user[0].position,
        department_id: department || user[0].department,
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

