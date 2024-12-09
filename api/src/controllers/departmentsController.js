
import pool from '../models/db.js';

export const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    res.status(500).send("Erro ao buscar departamentos");
  }
};

export const addDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("O nome do departamento é obrigatório");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO departments (name) VALUES ?",
      [name]
    );
    const insertId = result.insertId;

    const tableName = `queueOf${name.replace(/ /g, "_")}`;
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT,
        message_body TEXT,
        message_from VARCHAR(255),
        conversation_id VARCHAR(255),
        message_timestamp BIGINT,
        status ENUM('fila', 'respondida') DEFAULT 'fila',
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createTableQuery);

    res.status(201).json({ id: insertId, name });
  } catch (error) {
    console.error("Erro ao salvar departamento:", error);
    res.status(500).send("Erro ao salvar departamento");
  }
};

export const deleteDepartment = async (req, res) => {
  const departmentId = req.params.id;

  try {
    const [result] = await pool.query("DELETE FROM departments WHERE id = ?", [departmentId]);
    if (result.affectedRows > 0) {
      res.status(200).send("Departamento deletado com sucesso");
    } else {
      res.status(404).send("Departamento não encontrado");
    }
  } catch (error) {
    console.error("Erro ao deletar departamento:", error);
    res.status(500).send("Erro ao deletar departamento");
  }
};

export const updateDepartment = async (req, res) => {
  const { name } = req.body;
  const departmentId = req.params.id;
  let oldName;

  if (!name) {
    return res.status(400).send("O novo nome do departamento é obrigatório");
  } else if(!departmentId) {
    return res.status(400).send("O id do departamento é obrigatório");
  }

  // buscar nome original do departamento
  try {
    const [rows] = await pool.query("SELECT name FROM departments WHERE id = ?", [departmentId]);
    if (rows.length === 0) {
      return res.status(404).send("Departamento não encontrado");
    }
    oldName = rows[0].name;
  } catch (error) {
    console.error("Erro ao buscar nome do departamento:", error);
    return res.status(500).send("Erro ao buscar nome do departamento");
  }

  // atualizar tabela de queue
  try {
    const oldTableName = `queueOf${oldName.replace(/ /g, "_")}`;
    const newTableName = `queueOf${name.replace(/ /g, "_")}`;
    const [resultUpdate] = await pool.query(`RENAME TABLE ?? TO ??`, [oldTableName, newTableName]);
    if (resultUpdate.affectedRows = 0) {
      res.status(200).send(`Queue do departamento ${name} atualizado com sucesso`);
    }
  } catch (error) {
    console.error("Erro ao atualizar departamento:", error);
    res.status(500).send("Erro ao atualizar departamento");
  }

  // atualizar nome no departamento
  try {
    const [resultUpdate] = await pool.query(`UPDATE departments SET name = ? WHERE id = ?`,
    [name,departmentId])
    if (resultUpdate.affectedRows > 0) {
      res.status(200).send("Departamento atualizado com sucesso");
    } else {
      res.status(404).send("Departamento não encontrado");
    }
  } catch (error) {
    console.error("Erro ao atualizar departamento:", error);
    res.status(500).send("Erro ao atualizar departamento");
  }
};
