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
import { authenticateUser, authenticateJWT } from "./auth.js";
import moment from "moment";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mysql from "mysql2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://tetochat-8m0r.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(bodyParser.json());

const allowedOrigins = ["http://localhost:5173", "https://tetochat-8m0r.onrender.com"];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

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
    process.exit(1);
  }
  console.log('Conectado ao banco de dados MySQL.');
});

io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });

  socket.on('new_message', (message) => {
    io.emit('new_message', message);  // Emite para todos os conectados
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

app.post('/send', authenticateJWT, async (req, res) => {
  const { toPhone, text } = req.body;
  const userId = req.user.id;

  if (!toPhone || !text) {
    return res.status(400).send("toPhone e text são obrigatórios");
  }

  try {
    await sendMessage(toPhone, text, process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);

    const [contactRows] = await pool.query("SELECT id FROM contacts WHERE phone = ?", [toPhone]);
    let contactId;
    if (contactRows.length > 0) {
      contactId = contactRows[0].id;
    } else {
      const [result] = await pool.query(
        "INSERT INTO contacts (name, phone) VALUES (?, ?)",
        ['API', toPhone]
      );
      contactId = result.insertId;
    }

    const sql = `
      INSERT INTO whatsapp_messages (phone_number_id, display_phone_number, contact_name, wa_id, message_id, message_from, message_timestamp, message_type, message_body, contact_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      process.env.DISPLAY_PHONE_NUMBER,
      'API',
      toPhone,
      `msg-${Date.now()}`,
      'me',
      Math.floor(Date.now() / 1000).toString(),
      'text',
      text,
      contactId,
      userId
    ];

    await pool.query(sql, values);

    await pool.query(
      "UPDATE queue SET status = 'respondida', user_id = ? WHERE contact_id = ?",
      [userId, contactId]
    );

    io.emit('new_message', {
      phone_number_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      display_phone_number: process.env.DISPLAY_PHONE_NUMBER,
      contact_name: 'API',
      wa_id: toPhone,
      message_id: `msg-${Date.now()}`,
      message_from: 'me',
      message_timestamp: Math.floor(Date.now() / 1000).toString(),
      message_type: 'text',
      message_body: text,
      contact_id: contactId,
      user_id: userId
    });

    res.status(200).send("Mensagem enviada com sucesso");
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).send("Erro ao enviar mensagem");
  }
});

app.get("/chats", authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT c.*
      FROM contacts c
      JOIN whatsapp_messages wm ON c.id = wm.contact_id
      JOIN queue q ON c.id = q.contact_id
      WHERE wm.message_from = 'me' AND wm.user_id = ?
      AND q.status = 'respondida' AND q.department_atual = ?
    `, [userId, req.user.department]);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    res.status(500).send("Erro ao buscar conversas");
  }
});

app.post('/transfer', async (req, res) => {
  const { contactId, departmentId } = req.body;

  if (!contactId || !departmentId) {
    return res.status(400).send("Os campos 'contactId' e 'departmentId' são obrigatórios");
  }

  try {
    await pool.query(
      "UPDATE queue SET department_atual = ?, status = 'fila', user_id = NULL WHERE contact_id = ?",
      [departmentId, contactId]
    );

    io.emit('contact_transferred', { contactId, departmentId });

    res.status(200).send("Atendimento transferido com sucesso para a fila");
  } catch (error) {
    console.error("Erro ao transferir atendimento:", error);
    res.status(500).send("Erro ao transferir atendimento");
  }
});

server.listen(3005, () => console.log(`Servidor rodando na porta ${3005}`));
