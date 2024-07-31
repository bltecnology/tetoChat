import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import pool from './database';
import dotenv from 'dotenv';
import { addUser } from './newUser';
import { authenticateUser, authenticateJWT } from './auth';
import { RowDataPacket } from 'mysql2';
import moment from 'moment';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const VERIFY_TOKEN = 'blchat';

// Configuração do Multer para uploads de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const getProfilePicture = async (phoneNumber: string): Promise<string | null> => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !whatsappBusinessAccountId) {
    console.error("As variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID são necessárias.");
    throw new Error("As variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID são necessárias.");
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v13.0/${whatsappBusinessAccountId}/contacts`, {
      params: {
        phone_number: phoneNumber
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const profilePictureUrl = response.data.data[0]?.profile_picture_url || null;
    return profilePictureUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro ao obter a imagem do perfil:', error.response ? error.response.data : error.message);
    } else {
      console.error('Erro desconhecido ao obter a imagem do perfil:', error);
    }
    throw error;
  }
};

app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  } else {
    res.status(400).send('Bad Request');
  }
});

app.post('/webhook', (req: Request, res: Response) => {
  const body = req.body;

  console.log('Recebido webhook:', JSON.stringify(body, null, 2));

  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach((entry: any) => {
      entry.changes.forEach(async (change: any) => {
        if (change.value.messages) {
          change.value.messages.forEach(async (message: any) => {
            console.log('Mensagem recebida:', message);

            // Salvar a mensagem no banco de dados
            try {
              const timestamp = moment.unix(message.timestamp).format('YYYY-MM-DD HH:mm:ss');
              await pool.execute(
                'INSERT INTO messages (content, from_phone, to_phone, timestamp) VALUES (?, ?, ?, ?)',
                [message.text.body, message.from, entry.id, timestamp]
              );
              console.log('Mensagem salva no banco de dados.');
            } catch (error) {
              console.error('Erro ao salvar mensagem no banco de dados:', error);
            }
          });
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/messages', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM messages');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).send('Erro ao buscar mensagens');
  }
});

app.get('/profile-picture', async (req: Request, res: Response) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).send('Número de telefone é obrigatório');
  }

  try {
    const profilePictureUrl = await getProfilePicture(phone as string);
    res.json({ profilePictureUrl });
  } catch (error) {
    res.status(500).send('Erro ao obter a imagem do perfil');
  }
});

app.post('/contacts', async (req: Request, res: Response) => {
  const { name, phone, tag, note, cpf, rg, email } = req.body;

  if (!name || !phone) {
    return res.status(400).send('Nome e telefone são obrigatórios');
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, tag, note, cpf, rg, email]
    );
    const insertId = (result as any).insertId;
    res.status(201).send(`Contato adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    res.status(500).send('Erro ao salvar contato');
  }
});

app.get('/contacts', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM contacts');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).send('Erro ao buscar contatos');
  }
});

// Rota para enviar mensagens
app.post('/send', async (req: Request, res: Response) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).send('Número de telefone e mensagem são obrigatórios');
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/messages`;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    const data = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Mensagem enviada:', response.data);
    res.status(200).send('Mensagem enviada com sucesso');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro ao enviar mensagem:', error.response?.data);
      res.status(500).send('Erro ao enviar mensagem');
    } else {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).send('Erro ao enviar mensagem');
    }
  }
});

// Rota para fazer upload de arquivos
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.send({ fileUrl });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota para buscar usuários
app.get('/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).send('Erro ao buscar usuários');
  }
});

app.post('/users', addUser);

// Rota para autenticar usuário
app.post('/login', authenticateUser);

// Rota para buscar dados do usuário autenticado
app.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, name, email, position, department FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).send('Usuário não encontrado');
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).send('Erro ao buscar dados do usuário');
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
