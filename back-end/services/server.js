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
    entries.forEach(entry => {
      const changes = entry.changes;
      changes.forEach(change => {
        const data = change.value;
        if (data && data.messages && data.messages.length > 0) {
          const message = data.messages[0];
          const contact = data.contacts[0];

          if (!contact || !contact.profile || !contact.wa_id || !message || !message.text || !message.text.body) {
            console.error('Dados inválidos recebidos:', JSON.stringify(request.body));
            response.sendStatus(400);
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
                  response.sendStatus(500);
                  return;
              }
              console.log('Dados inseridos com sucesso:', results);
          });
        }
      });
    });
    response.sendStatus(200);
  } else {
    console.error('Estrutura do webhook não corresponde ao esperado:', JSON.stringify(request.body));
    response.sendStatus(400);
  }
});

async function handleIncomingMessage(message, whatsappBusinessAccountId) {
  const fromPhone = message.from;
  const textBody = message.text.body;

  // Verificar se é uma nova interação ou se está respondendo a opções
  const currentState = await getCurrentState(fromPhone);

  if (!currentState || textBody.match(/^\d+$/)) {
    // Novo cliente ou respondendo com opção de setor
    const sectorResponse = parseInt(textBody, 10);
    await routeMessageBasedOnSector(fromPhone, sectorResponse, whatsappBusinessAccountId);
  } else {
    // Mensagem normal para ser encaminhada ao setor correspondente
    await sendMessageToSectorEmployee(fromPhone, textBody, currentState);
  }
}

async function getCurrentState(phone) {
  // Implementar lógica para buscar o estado atual da conversa
}

async function updateCustomerSector(phone, sector) {
  // Implementar lógica para atualizar o setor do cliente
}

async function routeMessageBasedOnSector(fromPhone, sectorResponse, whatsappBusinessAccountId) {
  if (!sectorResponse) {
    const initialMessage = "Olá! Selecione um setor:\n1 - Administrativo\n2 - Vendas";
    await sendMessage(fromPhone, initialMessage, whatsappBusinessAccountId);
  } else {
    updateCustomerSector(fromPhone, sectorResponse);
  }
}

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
