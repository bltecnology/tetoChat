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

app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log(body)
  if (body){
    res.json({ message: body, message: "teste" });
  }
  // if (body.object === "whatsapp_business_account") {
  //   try {
  //     for (const entry of body.entry) {
  //       for (const change of entry.changes) {
  //         if (change.value.messages) {
  //           for (const message of change.value.messages) {
  //             await handleIncomingMessage(message, entry.id);
  //           }
  //         }
  //       }
  //     }
  //     res.status(200).send("Mensagens processadas com sucesso.");
  //   } catch (error) {
  //     console.error("Erro ao processar mensagens:", error);
  //     res.status(500).send("Erro ao processar mensagens.");
  //   }
  // } else {
  //   res.status(400).send("Bad Request");
  // }
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
