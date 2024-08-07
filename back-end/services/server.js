import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import multer from "multer";
import path from "path";
import pool from "./database.js";
import dotenv from "dotenv";
import { addUser } from "./newUser.js";
import { authenticateUser, authenticateJWT } from "./auth.js";
import moment from "moment";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mysql from "mysql2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173", optionsSuccessStatus: 200 }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      process.exit(1); // Sai do processo em caso de erro na conexão
  }
  console.log('Conectado ao banco de dados MySQL.');

  // Remover coluna incorreta 'tags' e adicionar a coluna correta 'tag'
  const dropColumnQuery = 'ALTER TABLE contacts DROP COLUMN IF EXISTS tags';
  connection.query(dropColumnQuery, (err, results) => {
      if (err) {
          console.error('Erro ao remover a coluna "tags":', err);
      } else {
          console.log('Coluna "tags" removida com sucesso, se existia.');
          
          // Adicionar coluna 'tag' correta
          const addColumnQuery = 'ALTER TABLE contacts ADD COLUMN tag VARCHAR(20)';
          connection.query(addColumnQuery, (err, results) => {
              if (err) {
                  if (err.code === 'ER_DUP_FIELDNAME') {
                      console.log('A coluna "tag" já existe.');
                  } else {
                      console.error('Erro ao adicionar a coluna "tag":', err);
                  }
              } else {
                  console.log('Coluna "tag" adicionada com sucesso à tabela "contacts".');
              }
          });
      }
  });
});

app.get('/webhook', function (req, res) {
  if (
      req.query['hub.mode'] == 'subscribe' &&
      req.query['hub.verify_token'] == process.env.WEBHOOK_VERIFY_TOKEN
  ) {
      res.send(req.query['hub.challenge']);
  } else {
      res.sendStatus(400);
  }
});

app.post('/webhook', function (request, response) {
  console.log('Incoming webhook: ' + JSON.stringify(request.body));

  const entries = request.body.entry;

  if (entries && entries.length > 0) {
    let allEntriesProcessed = true;

    entries.forEach(entry => {
      const changes = entry.changes;
      changes.forEach(change => {
        const data = change.value;
        if (data && data.messages && data.messages.length > 0) {
          const message = data.messages[0];
          const contact = data.contacts[0];

          if (!contact || !contact.profile || !contact.wa_id || !message || !message.text || !message.text.body) {
            console.error('Dados inválidos recebidos:', JSON.stringify(request.body));
            allEntriesProcessed = false;
            return;
          }

          const sql = 'INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
          const values = [
              data.metadata.phone_number_id,
              data.metadata.display_phone_number,
              contact.profile.name,
              contact.wa_id,
              message.id,
              message.from,
              message.timestamp,
              message.type,
              message.text.body
          ];

          connection.query(sql, values, (err, results) => {
              if (err) {
                  console.error('Erro ao inserir dados no banco de dados:', err);
                  allEntriesProcessed = false;
                  return;
              }
              console.log('Dados inseridos com sucesso:', results);
          });
        }
      });
    });

    if (allEntriesProcessed) {
      response.sendStatus(200);
    } else {
      response.sendStatus(500);
    }
  } else {
    console.error('Estrutura do webhook não corresponde ao esperado:', JSON.stringify(request.body));
    response.sendStatus(400);
  }
});

app.post('/send', async (req, res) => {
  const { toPhone, text } = req.body;

  if (!toPhone || !text) {
    return res.status(400).send("toPhone e text são obrigatórios");
  }

  try {
    await sendMessage(toPhone, text, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
    res.status(200).send("Mensagem enviada com sucesso");
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).send("Erro ao enviar mensagem");
  }
});

async function sendMessage(toPhone, text, whatsappBusinessAccountId) {
  const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/messages`;
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { body: text }
  };
  const headers = { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` };
  await axios.post(url, data, { headers });
}

app.get("/messages", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM messages");
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

app.post("/users", addUser);
app.post("/login", authenticateUser);

app.get("/me", authenticateJWT, async (req, res) => {
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

app.get('/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3005, () => console.log(`Servidor rodando na porta ${3005}`));
