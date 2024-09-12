import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import multer from "multer";
import pool from "./database.js";
import dotenv from "dotenv";
import { addUser } from "./newUser.js";
import { authenticateUser, authenticateJWT } from "./auth.js"; // Use a função importada de auth.js
import { fileURLToPath } from "url";
import { dirname } from "path";
import mysql from "mysql2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

export const authenticateJWTRoute = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1]; // Extrai o token do cabeçalho

  if (!token) {
    return res.status(401).send("Token de acesso é necessário");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Token inválido ou expirado");
    }

    req.user = user; // Anexa o usuário decodificado à requisição
    next();
  });
};

// const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 1 hora de expiração

app.use(bodyParser.json());

// Configuração de CORS
app.use(
  cors({
    origin: [
      "https://teto-chat.vercel.app",
      "https://tetochat-8m0r.onrender.com",
    ],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Conexão com o banco de dados
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados MySQL.");

  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'tag'
  `;
  connection.query(checkColumnQuery, (err, results) => {
    if (err) {
      console.error('Erro ao verificar coluna "tag":', err);
    } else if (results.length === 0) {
      const addColumnQuery = "ALTER TABLE contacts ADD COLUMN tag VARCHAR(20)";
      connection.query(addColumnQuery, (err, results) => {
        if (err) {
          console.error('Erro ao adicionar a coluna "tag":', err);
        } else {
          console.log(
            'Coluna "tag" adicionada com sucesso à tabela "contacts".'
          );
        }
      });
    } else {
      console.log('A coluna "tag" já existe na tabela "contacts".');
    }
  });
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("new_message", (message) => {
    if (message.user_id === userId) {
      socket.emit("new_message", message);

      // Emitir um evento adicional para atualizar a aba de "Chat"
      socket.broadcast.emit("update_chat_contacts", {
        contact_id: message.contact_id,
        user_id: message.user_id,
      });
    }
  });
});

async function sendMessage(toPhone, text, whatsappBusinessAccountId, socket) {
  console.log("Enviando mensagem para:", toPhone);
  console.log("Conteúdo da mensagem:", text);

  const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/messages`;
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { body: text },
  };
  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log("Resposta da API do WhatsApp:", response.data);

    if (socket) {
      socket.emit("new_message", {
        phone_number_id: whatsappBusinessAccountId,
        to: toPhone,
        message_body: text,
        timestamp: new Date().getTime(),
      });
    }

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem para o WhatsApp:", error);
    throw error;
  }
}

app.get("/webhook", function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.WEBHOOK_VERIFY_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

app.post("/webhook", async (request, response) => {
  console.log("Incoming webhook: " + JSON.stringify(request.body));

  const entries = request.body.entry;

  if (entries && entries.length > 0) {
    let allEntriesProcessed = true;

    for (const entry of entries) {
      const changes = entry.changes;
      for (const change of changes) {
        const data = change.value;
        if (data && data.messages && data.messages.length > 0) {
          const message = data.messages[0];
          const contact =
            data.contacts && data.contacts.length > 0 ? data.contacts[0] : null;

          if (
            !contact ||
            !contact.profile ||
            !contact.wa_id ||
            !message ||
            !message.text ||
            !message.text.body
          ) {
            console.error(
              "Dados inválidos recebidos:",
              JSON.stringify(request.body)
            );
            allEntriesProcessed = false;
            continue;
          }

          let contactId;
          try {
            const [contactRows] = await pool.query(
              "SELECT id FROM contacts WHERE phone = ?",
              [contact.wa_id]
            );
            if (contactRows.length > 0) {
              contactId = contactRows[0].id;
            } else {
              const [result] = await pool.query(
                "INSERT INTO contacts (name, phone) VALUES (?, ?)",
                [contact.profile.name, contact.wa_id]
              );
              contactId = result.insertId;
            }
          } catch (err) {
            console.error("Erro ao buscar ou criar contato:", err);
            allEntriesProcessed = false;
            continue;
          }

          const sql =
            "INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
          const values = [
            data.metadata.phone_number_id,
            data.metadata.display_phone_number,
            contact.profile.name,
            contact.wa_id,
            message.id,
            message.from,
            message.timestamp,
            message.type,
            message.text.body,
            contactId,
          ];

          try {
            await pool.query(sql, values);
            io.emit("new_message", {
              phone_number_id: data.metadata.phone_number_id,
              display_phone_number: data.metadata.display_phone_number,
              contact_name: contact.profile.name,
              wa_id: contact.wa_id,
              message_id: message.id,
              message_from: message.from,
              message_timestamp: message.timestamp,
              message_type: message.type,
              message_body: message.text.body,
              contact_id: contactId,
            });
            console.log("Dados inseridos com sucesso");
          } catch (err) {
            console.error("Erro ao inserir dados no banco de dados:", err);
            allEntriesProcessed = false;
          }
        }
      }
    }

    if (allEntriesProcessed) {
      response.sendStatus(200);
    } else {
      response.sendStatus(500);
    }
  } else {
    console.error(
      "Estrutura do webhook não corresponde ao esperado:",
      JSON.stringify(request.body)
    );
    response.sendStatus(400);
  }
});

app.post("/send", async (req, res) => {
  const { toPhone, text } = req.body;
  const userId = req.user.id;

  if (!toPhone || !text) {
    return res.status(400).send("toPhone e text são obrigatórios");
  }

  try {
    await sendMessage(toPhone, text, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);

    const [contactRows] = await pool.query(
      "SELECT id FROM contacts WHERE phone = ?",
      [toPhone]
    );
    let contactId;
    if (contactRows.length > 0) {
      contactId = contactRows[0].id;
    } else {
      const [result] = await pool.query(
        "INSERT INTO contacts (name, phone) VALUES (?, ?)",
        ["API", toPhone]
      );
      contactId = result.insertId;
    }

    const conversationId = `conv-${Date.now()}`;

    const insertMessageQuery = `
      INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(insertMessageQuery, [
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      process.env.DISPLAY_PHONE_NUMBER,
      "API",
      toPhone,
      `msg-${Date.now()}`,
      "me",
      Math.floor(Date.now() / 1000).toString(),
      "text",
      text,
      contactId,
      userId,
    ]);

    const [userRow] = await pool.query(
      "SELECT department FROM users WHERE id = ?",
      [userId]
    );
    const departmentName = userRow[0].department;
    const queueTableName = `queueOf${departmentName}`;

    const insertQueueQuery = `
      INSERT INTO ${queueTableName} (contact_id, conversation_id, status)
      VALUES (?, ?, 'fila')
    `;
    await pool.query(insertQueueQuery, [contactId, conversationId]);

    res.status(200).send("Mensagem enviada e salva com sucesso");
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).send("Erro ao enviar mensagem");
  }
});

app.get("/chats", async (req, res) => {
  const userId = req.user.id;
  const chatTableName = `chat_user_${userId}`;

  try {
    const [rows] = await pool.query(`
      SELECT c.*
      FROM contacts c
      JOIN ${chatTableName} cu ON c.id = cu.contact_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    res.status(500).send("Erro ao buscar conversas");
  }
});

app.get("/messages", async (req, res) => {
  const contactId = req.query.contact;

  if (!contactId) {
    return res.status(400).send("O ID do contato é obrigatório");
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM whatsapp_messages WHERE contact_id = ? ORDER BY message_timestamp ASC",
      [contactId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).send("Erro ao buscar mensagens");
  }
});

app.get("/contacts", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM contacts");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).send("Erro ao buscar contatos");
  }
});

app.post("/contacts", async (req, res) => {
  const { name, phone, tag, note, cpf, rg, email } = req.body;
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
});

app.delete("/contacts/:id", async (req, res) => {
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
});

app.post("/users", addUser);
app.post("/login", authenticateUser);

app.get("/me", async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, position, department FROM users WHERE id = ?",
      [userId]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).send("Usuário não encontrado");
    }
    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    res.status(500).send("Erro ao buscar dados do usuário");
  }
});

app.get("/profile-picture/:wa_id", async (req, res) => {
  const defaultProfilePic = "/path/to/default-profile-pic.png";
  res.json({ profilePicUrl: defaultProfilePic });
});

app.post("/departments", async (req, res) => {
  const { name } = req.body;
  console.log("aaa");

  if (!name) {
    return res.status(400).send("O nome do departamento é obrigatório");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO departments (name) VALUES (?)",
      [name]
    );
    const insertId = result.insertId;

    const tableName = `queueOf${name}`;
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
    console.log("bbb");

    res.status(201).json({ id: insertId, name });
  } catch (error) {
    console.error("Erro ao salvar departamento:", error);
    res.status(500).send("Erro ao salvar departamento");
  }
  console.log("ccc");
});

app.get("/departments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    res.status(500).send("Erro ao buscar departamentos");
  }
});

app.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).send("Erro ao buscar usuários");
  }
});

app.post("/transfer", async (req, res) => {
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

    // await pool.query("DELETE FROM queue WHERE contact_id = ?", [contactId]);

    res.status(200).send("Atendimento transferido com sucesso para a fila");
  } catch (error) {
    console.error("Erro ao transferir atendimento:", error);
    res.status(500).send("Erro ao transferir atendimento");
  }
});

app.post("/updateQueueStatus", async (req, res) => {
  const { contactId, userId } = req.body;

  if (!contactId || !userId) {
    return res
      .status(400)
      .send("Os campos 'contactId' e 'userId' são obrigatórios");
  }

  try {
    await pool.query(
      "UPDATE queue SET status = 'respondida', user_id = ? WHERE contact_id = ?",
      [userId, contactId]
    );

    res.status(200).send("Status atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar status da fila:", error);
    res.status(500).send("Erro ao atualizar status da fila");
  }
});

app.post("/positions", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Nome obrigatório");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO positions (name) VALUES (?)",
      [name]
    );
    const insertId = result.insertId;
    res.status(201).json({ id: insertId, name });
  } catch (error) {
    console.error("Erro ao salvar cargo:", error);
    res.status(500).send("Erro ao salvar cargo");
  }
  console.log("ccc");
});

app.get("/queue", async (req, res) => {
  const userId = req.user.id;

  try {
    console.log("Buscando departamento do usuário...");
    const [userRow] = await pool.query(
      "SELECT department FROM users WHERE id = ?",
      [userId]
    );
    if (!userRow || userRow.length === 0) {
      console.log("Usuário não encontrado");
      return res.status(404).send("Usuário não encontrado");
    }

    const departmentName = userRow[0].department;
    console.log(`Usuário está no departamento: ${departmentName}`);

    const queueTableName = `queueOf${departmentName}`;
    console.log(`Buscando fila na tabela: ${queueTableName}`);

    const [rows] = await pool.query(
      `SELECT * FROM ${queueTableName} WHERE status = 'fila'`
    );
    console.log("Fila encontrada:", rows);
    res.json(rows);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      console.error(`Tabela ${queueTableName} não encontrada`);
      return res.status(500).send(`Tabela ${queueTableName} não encontrada`);
    }
    console.error("Erro ao buscar fila:", error);
    res.status(500).send("Erro ao buscar fila");
  }
});

app.post("/quickResponses", (req, res) => {
  const { text, department } = req.body;

  if (!text || !department) {
    return res
      .status(400)
      .json({ error: "Campos text e department são obrigatórios" });
  }

  const query = "INSERT INTO quickResponses (text, department) VALUES (?, ?)";
  db.query(query, [text, department], (err, result) => {
    if (err) {
      console.error("Erro ao inserir no banco de dados:", err);
      return res.status(500).json({ error: "Erro ao salvar resposta rápida" });
    }
    res
      .status(201)
      .json({
        message: "Resposta rápida salva com sucesso",
        id: result.insertId,
      });
  });
});

app.put("/users/:id", async (req, res) => {
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
});

app.delete("/users/:id", async (rec, res) => {
  const userId = req.params.id;

  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    res.status(200).send("Usuário deletado com sucesso");
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).send("Erro ao deletar usuário");
  }
});

app.post("/saveMessage", async (req, res) => {
  const { contactId, message, message_from } = req.body;
  const userId = req.user.id;
  const chatTableName = `chat_user_${userId}`;

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${chatTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT,
        conversation_id VARCHAR(255),
        message_body TEXT,
        message_from VARCHAR(255),
        message_timestamp BIGINT,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createTableQuery);

    const insertMessageQuery = `
      INSERT INTO ${chatTableName} (contact_id, conversation_id, message_body, message_from, message_timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(insertMessageQuery, [
      contactId,
      `conv-${Date.now()}`,
      message,
      message_from,
      Math.floor(Date.now() / 1000),
    ]);

    res.status(200).send("Mensagem salva com sucesso");
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    res.status(500).send("Erro ao salvar mensagem");
  }
});

app.get("/verifyToken", async (req, res) => {
  console.log(req);

  const user = req.user;

  try {
    res.json({ message: "You are authenticated", user: req.user });
  } catch (error) {}
  res.status(401).send(error);
});

app.get("/test", (req, res) => {
  res.json({ message: "Hello World" });
});

server.listen(3005, () => console.log(`Servidor rodando na porta 3005`));
