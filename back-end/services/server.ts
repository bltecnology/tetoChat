import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import connectDB from './database';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Configuração de CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const VERIFY_TOKEN = 'blchat';
let messages: any[] = []; // Armazena as mensagens recebidas

// Função para salvar um contato no banco de dados
const saveContact = async (name: string, phone: string, tag: string, note: string, cpf: string, rg: string, email: string) => {
  const connection = await connectDB();
  try {
    const [result]: any = await connection.execute(
      'INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, tag, note, cpf, rg, email]
    );
    return result.insertId;
  } finally {
    connection.release();
  }
};

// Função para obter a imagem de perfil de um contato
const getProfilePicture = async (phoneNumber: string): Promise<string | null> => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN; // Substitua pelo seu token de acesso
  const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID; // Substitua pelo seu WhatsApp Business Account ID

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
    if (error instanceof AxiosError) {
      console.error('Erro ao obter a imagem do perfil:', error.response ? error.response.data : error.message);
    } else {
      console.error('Erro desconhecido ao obter a imagem do perfil:', error);
    }
    throw error;
  }
};

// Rota para verificar o webhook
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

// Rota para receber mensagens do webhook
app.post('/webhook', (req: Request, res: Response) => {
  const body = req.body;

  console.log('Recebido webhook:', JSON.stringify(body, null, 2)); // Log para verificar a estrutura do webhook recebido

  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach((entry: any) => {
      entry.changes.forEach((change: any) => {
        if (change.value.messages) {
          change.value.messages.forEach((message: any) => {
            console.log('Mensagem recebida:', message); // Log para cada mensagem recebida
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

// Rota para obter todas as mensagens
app.get('/messages', (req: Request, res: Response) => {
  res.json(messages);
});

// Rota para obter a imagem de perfil de um contato
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

// Rota para salvar um contato
app.post('/contacts', async (req: Request, res: Response) => {
  const { name, phone, tag, note, cpf, rg, email } = req.body;

  try {
    const insertId = await saveContact(name, phone, tag, note, cpf, rg, email);
    res.status(201).json({ id: insertId });
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
    res.status(500).send('Erro ao salvar contato');
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
