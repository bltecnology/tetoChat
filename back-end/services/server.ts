import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

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

// Função para enviar mensagens utilizando a API do WhatsApp
const sendMessage = async (phone: string, text: string) => {
    const url = `https://graph.facebook.com/v13.0/408476129004761/messages`;
    const token = 'EAAXfbaD8KnoBO9ZAcdTxMClASwBd301sCp20Ny9jrhMeUCZBRTGsnFhLOAZCQbcJo3hLC5a5fLXYrUn34nQMrcIBlFHB1csaozV91KVdVV2ZCpl56dhuVVsvRYYAZCI9kjxWo95bC0hZBrCbRgZAz8Ol7NH4IAlzX3ajZAJYPYIzZB3U8f9S7Gpxai2S2DrZA9ev9A2MatclFwHhIRoNAHkZCIZD'; // Substitua pelo seu token de acesso

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: {
            body: text
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Resposta da API do WhatsApp:', response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Erro ao enviar mensagem:', error.response?.data);
        } else {
            console.error('Erro ao enviar mensagem:', error);
        }
        throw error;
    }
};

// Rota para enviar mensagens
app.post('/send', async (req: Request, res: Response) => {
    const { phone, message } = req.body;
    try {
        await sendMessage(phone, message);
        res.status(200).send('Mensagem enviada com sucesso');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            res.status(500).send(`Erro ao enviar mensagem: ${error.response?.data}`);
        } else {
            res.status(500).send('Erro ao enviar mensagem');
        }
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
