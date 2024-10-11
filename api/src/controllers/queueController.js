
import pool from '../models/db.js';


export const getQueue = async (req, res) => {
  const {department} = req.params;
  console.log(department);
  
  try {
    const [rows] = await pool.query(`SELECT * FROM queueOf${department}`);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar filas:", error);
    res.status(500).send("Erro ao buscar filas");
  }
};

export const addQueue = async (req, res) => {
  const { department, userId } = req.body;
  if (!department || !userId) {
    return res.status(400).send("Departamento e usuário são obrigatórios");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO queue (department, userId) VALUES (?, ?)",
      [department, userId]
    );
    res.status(201).send(`Fila adicionada com sucesso. ID: ${result.insertId}`);
  } catch (error) {
    console.error("Erro ao adicionar fila:", error);
    res.status(500).send("Erro ao adicionar fila");
  }
};


export const deleteQueue = async (req, res) => {
  const queueId = req.params.id;

  try {
    const [result] = await pool.query("DELETE FROM queue WHERE id = ?", [queueId]);
    if (result.affectedRows > 0) {
      res.status(200).send("Fila deletada com sucesso");
    } else {
      res.status(404).send("Fila não encontrada");
    }
  } catch (error) {
    console.error("Erro ao deletar fila:", error);
    res.status(500).send("Erro ao deletar fila");
  }
};
