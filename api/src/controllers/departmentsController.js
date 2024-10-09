
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
    return res.status(400).send("Nome do departamento é obrigatório");
  }

  try {
    const [result] = await pool.query("INSERT INTO departments (name) VALUES (?)", [name]);
    res.status(201).send(`Departamento adicionado com sucesso. ID: ${result.insertId}`);
  } catch (error) {
    console.error("Erro ao adicionar departamento:", error);
    res.status(500).send("Erro ao adicionar departamento");
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
