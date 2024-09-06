import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import multer from "multer";
import path from "path";
import pool from "./database.js";
import dotenv from "dotenv";
import { addUser } from "./newUser.js";
import { authenticateUser, authenticateJWT as authJWT } from "./auth.js"; // Use a função importada de auth.js
import moment from "moment";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mysql from "mysql2";
import jwt from 'jsonwebtoken'; // Adicione esta importação para jwt

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://tetochat-8m0r.onrender.com"],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true
  }
});

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extrai o token do cabeçalho

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

const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 1 hora de expiração

app.use(bodyParser.json());

// Configuração de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://tetochat-8m0r.onrender.com'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Conexão com o banco de dados
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados MySQL.');

  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'tag'
  `;
  connection.query(checkColumnQuery, (err, results) => {
    if (err) {
      console.error('Erro ao verificar coluna "tag":', err);
    } else if (results.length === 0) {
      const addColumnQuery = 'ALTER TABLE contacts ADD COLUMN tag VARCHAR(20)';
      connection.query(addColumnQuery, (err, results) => {
        if (err) {
          console.error('Erro ao adicionar a coluna "tag":', err);
        } else {
          console.log('Coluna "tag" adicionada com sucesso à tabela "contacts".');
        }
      });
    } else {
      console.log('A coluna "tag" já existe na tabela "contacts".');
    }
  });
});

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('new_message', (message) => {
    if (message.user_id === userId) {
      socket.emit('new_message', message);

      // Emitir um evento adicional para atualizar a aba de "Chat"
      socket.broadcast.emit('update_chat_contacts', {
        contact_id: message.contact_id,
        user_id: message.user_id
      });
    }
  });
});

async function sendMessage(toPhone, text, whatsappBusinessAccountId, socket) {
  console.log('Enviando mensagem para:', toPhone);
  console.log('Conteúdo da mensagem:', text);

  const url = `https://graph.facebook.com/v20.0/${whatsappBusinessAccountId}/messages`;
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { body: text }
  };
  const headers = { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('Resposta da API do WhatsApp:', response.data);

    if (socket) {
      socket.emit('new_message', {
        phone_number_id: whatsappBusinessAccountId,
        to: toPhone,
        message_body: text,
        timestamp: new Date().getTime()
      });
    }

    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem para o WhatsApp:', error);
    throw error;
  }
}

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

app.post('/webhook', async (request, response) => {
  console.log('Incoming webhook: ' + JSON.stringify(request.body));

  const entries = request.body.entry;

  if (entries && entries.length > 0) {
    let allEntriesProcessed = true;

    for (const entry of entries) {
      const changes = entry.changes;
      for (const change of changes) {
        const data = change.value;
        if (data && data.messages && data.messages.length > 0) {
          const message = data.messages[0];
          const contact = data.contacts && data.contacts.length > 0 ? data.contacts[0] : null;

          if (!contact || !contact.profile || !contact.wa_id || !message || !message.text || !message.text.body) {
            console.error('Dados inválidos recebidos:', JSON.stringify(request.body));
            allEntriesProcessed = false;
            continue;
          }

          let contactId;
          try {
            const [contactRows] = await pool.query("SELECT id FROM contacts WHERE phone = ?", [contact.wa_id]);
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
            console.error('Erro ao buscar ou criar contato:', err);
            allEntriesProcessed = false;
            continue;
          }

          const sql = 'INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
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
            contactId
          ];

          try {
            await pool.query(sql, values);
            io.emit('new_message', {
              phone_number_id: data.metadata.phone_number_id,
              display_phone_number: data.metadata.display_phone_number,
              contact_name: contact.profile.name,
              wa_id: contact.wa_id,
              message_id: message.id,
              message_from: message.from,
              message_timestamp: message.timestamp,
              message_type: message.type,
              message_body: message.text.body,
              contact_id: contactId
            });
            console.log('Dados inseridos com sucesso');
          } catch (err) {
            console.error('Erro ao inserir dados no banco de dados:', err);
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
    console.error('Estrutura do webhook não corresponde ao esperado:', JSON.stringify(request.body));
    response.sendStatus(400);
  }
});

app.post('/send', authenticateJWT, async (req, res) => {
  const { toPhone, text } = req.body;
  const userId = req.user.id;

  if (!toPhone || !text) {
    return res.status(400).send("toPhone e text são obrigatórios.");
  }

  try {
    const [rows] = await pool.query('SELECT whatsapp_business_account_id FROM users WHERE id = ?', [userId]);

    if (rows.length > 0) {
      const whatsappBusinessAccountId = rows[0].whatsapp_business_account_id;
      const response = await sendMessage(toPhone, text, whatsappBusinessAccountId, req.io);

      res.json(response);
    } else {
      res.status(404).send("Conta do WhatsApp não encontrada.");
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).send("Erro ao enviar mensagem.");
  }
});

// Outras rotas e middlewares
// ...

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
