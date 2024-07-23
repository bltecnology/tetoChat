import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import pool from './database';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const VERIFY_TOKEN = 'blchat';
let messages: any[] = [];

const getProfilePicture = async (phoneNumber: string): Promise<string | null> => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !whatsappBusinessAccountId) {
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
      entry.changes.forEach((change: any) => {
        if (change.value.messages) {
          change.value.messages.forEach((message: any) => {
            console.log('Mensagem recebida:', message);
            messages.push({
              from: message.from,
              content: message.text ? message.text.body : message,
            });
          });
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/messages', (req: Request, res: Response) => {
  res.json(messages);
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
    const connection = await pool.getConnection();
    const [result] = await connection.execute('INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, phone, tag, note, cpf, rg, email]);
    connection.release();
    const insertId = (result as any).insertId;
    res.status(201).send(`Contato adicionado com sucesso. ID: ${insertId}`);
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    res.status(500).send('Erro ao salvar contato');
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
