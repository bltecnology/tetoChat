import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios, { AxiosError } from 'axios';

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

// Função para obter a imagem de perfil de um contato
const getProfilePicture = async (phoneNumber: string): Promise<string | null> => {
  const token = 'EAAXfbaD8KnoBO6UFqkvTS9nACRX1ZCskIBNSAuLbH3vYP8tSanL8fiYZCp8oH3jSBDVZAzFtVUZAeRW2DTSqNB8LgFzLokQFECppkwJoOMmArsmTV0oL3LXmmdJt8dlse0RHcgSFJQ6mZCq8o4WegmUMA8Y2DiiLZAbEAAmMMH2C14SHJQY5bHoDZBabrqfZCsZBv3ltvmdx4KKGl7fjTHd8ZD'; // Substitua pelo seu token de acesso
  const whatsappBusinessAccountId = '370805929450440'; // Substitua pelo seu WhatsApp Business Account ID

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

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
