import pool from "../models/db.js";


export const transfer = async (req, res) => {
    const { contactId, departmentId } = req.body;
    const id = departmentId;
    if (!contactId || !departmentId) {
      return res
        .status(400)
        .send("Os campos 'contactId' e 'departmentId' são obrigatórios");
    }
  
    try {
      const [department] = await pool.query(
        "SELECT name FROM departments WHERE id = ?",
        [departmentId]
      );
  
      if (!department.length) {
        return res.status(404).send("Departamento não encontrado");
      }
  
      const tableName = `queueOf${department[0].name}`;
      const transferQuery = `
        INSERT INTO ${tableName} (contact_id, message_body, message_from, message_timestamp)
        SELECT contact_id, message_body, message_from, message_timestamp
        FROM whatsapp_messages
        WHERE contact_id = ?
      `;
      await pool.query(transferQuery, [contactId]);
  
      res.status(200).send("Atendimento transferido com sucesso para a fila");
    } catch (error) {
      console.error("Erro ao transferir atendimento:", error);
      res.status(500).send("Erro ao transferir atendimento");
    }
  };