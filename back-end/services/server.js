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
// Carregar variáveis de ambiente
dotenv.config();

const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const VERIFY_TOKEN = "blchat";

// Configuração do Multer para uploads de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const getProfilePicture = async (
  phoneNumber
) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !whatsappBusinessAccountId) {
    console.error(
      "As variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID são necessárias."
    );
    throw(
      "As variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID são necessárias."
    );
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v13.0/${whatsappBusinessAccountId}/contacts`,
      {
        params: {
          phone_number: phoneNumber,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const profilePictureUrl =
      response.data.data[0]?.profile_picture_url || null;
    return profilePictureUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Erro ao obter a imagem do perfil:",
        error.response ? error.response.data : error.message
      );
    } else {
      console.error("Erro desconhecido ao obter a imagem do perfil:", error);
    }
    throw error;
  }
};

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  } else {
    res.status(400).send("Bad Request");
  }
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    try {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              const timestamp = moment
                .unix(message.timestamp)
                .format("YYYY-MM-DD HH:mm:ss");
              await pool.execute(
                "INSERT INTO messages (content, from_phone, to_phone, timestamp) VALUES (?, ?, ?, ?)",
                [message.text.body, message.from, entry.id, timestamp]
              );
              console.log("Mensagem salva no banco de dados.");
            }
          }
        }
      }
      res.status(200).send("Mensagens processadas com sucesso.");
    } catch (error) {
      console.log("Erro ao salvar mensagem no banco de dados:", error);
      res.status(500).send("Erro ao processar mensagens.");
    }
  } else {
    res.status(400).send("Bad Request");
  }
});

app.get("/messages", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM messages"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).send("Erro ao buscar mensagens");
  }
});

app.get("/profile-picture", async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).send("Número de telefone é obrigatório");
  }

  try {
    const profilePictureUrl = await getProfilePicture(phone);
    res.json({ profilePictureUrl });
  } catch (error) {
    res.status(500).send("Erro ao obter a imagem do perfil");
  }
});

app.post("/contacts", async (req, res) => {
  const { name, phone, tag, note, cpf, rg, email } = req.body;

  if (!name || !phone) {
    return res.status(400).send("Nome e telefone são obrigatórios");
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, phone, tag, note, cpf, rg, email]
    );
    const insertId = (result).insertId;
    res.status(201).send(`Contato adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    res.status(500).send("Erro ao salvar contato");
  }
});

app.get("/contacts", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM contacts"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).send("Erro ao buscar contatos");
  }
});

// Rota para enviar mensagens
app.post("/send", async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res
      .status(400)
      .send("Número de telefone e mensagem são obrigatórios");
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/messages`;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    const data = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Mensagem enviada:", response.data);
    res.status(200).send("Mensagem enviada com sucesso");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Erro ao enviar mensagem:", error.response?.data);
      res.status(500).send("Erro ao enviar mensagem");
    } else {
      console.error("Erro ao enviar mensagem:", error);
      res.status(500).send("Erro ao enviar mensagem");
    }
  }
});

// Rota para fazer upload de arquivos
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.send({ fileUrl });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rota para buscar usuários
app.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).send("Erro ao buscar usuários");
  }
});

app.post("/users", addUser);

// Rota para autenticar usuário
app.post("/login", authenticateUser);

// Rota para buscar dados do usuário autenticado
app.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = (req).user.id;
    const [rows] = await pool.execute(
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
app.listen(3006, () => {
  console.log(`Servidor rodando na porta ${3006}`);
});
