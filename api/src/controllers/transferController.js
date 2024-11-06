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
      
      const departmentName = `${department[0].name}`;
      const tableName = `queueOf${department[0].name}`;
      const transferQuery = `
        INSERT INTO ${tableName} (contact_id, message_body, message_from, message_timestamp)
        SELECT contact_id, message_body, message_from, message_timestamp
        FROM whatsapp_messages
        WHERE contact_id = ?
      `;
      await pool.query(transferQuery, [contactId]);

      const statusQuery = `
        UPDATE contacts SET status = '${department[0].name}'
        WHERE id = ?
      `;
      await pool.query(statusQuery, [contactId]);
  
      res.status(200).send("Atendimento transferido com sucesso para a fila");
    } catch (error) {
      console.error("Erro ao transferir atendimento:", error);
      res.status(500).send("Erro ao transferir atendimento");
    }
  };

export const queueStandBy = async (req, res) => {
  const departmentTable = req.params.department;
  const tableName = `queueOf${departmentTable}`;

  try {
    const [contacts] = await pool.query(
      `SELECT DISTINCT c.* FROM contacts AS c INNER JOIN ${tableName} AS q ON q.contact_id = c.id`
    );
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).send("Erro ao buscar contatos");
  }
};

export const queueOut = async (req, res) => {
  const departmentTable = req.params.department;
  const tableName = `queueOf${departmentTable}`;
  const { idContact } = req.body; // Supondo que o ID está no corpo da requisição

  try {
    // Busca todos os nomes dos departamentos da tabela departments
    const [departments] = await pool.query("SELECT name FROM departments");

    // Cria um array com os nomes dos departamentos para validação
    const validDepartments = departments.map(dept => dept.name);

    // Valida se o departmentTable é um nome de departamento válido
    if (!validDepartments.includes(departmentTable)) {
      return res.status(400).send("Departamento inválido");
    }

    // Executa o DELETE somente se o departamento for válido
    await pool.query(
      `DELETE FROM ${tableName} WHERE contact_id = ?`, 
      [idContact]
    );

    res.status(200).json({ message: "Contato removido da fila com sucesso" });
  } catch (error) {
    console.error("Erro ao remover contato da fila:", error);
    res.status(500).send("Erro ao remover contato da fila");
  }
};
