import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const VERIFY_TOKEN = 'blchat';
let messages: any[] = [];

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

const sendMessage = async (phone: string) => {
    const url = `https://graph.facebook.com/v13.0/370805929450440/messages`;
    const token = 'EAAXfbaD8KnoBO6uWywegWKGg8QrYq7s600lsYbOa04w9Y6tuIqowUza0dV81ZBOpDe035JVpnBUJdVRZBZCZCGZAElzbL7qPWHzvHYvgaMYp1ZA2m3QN7da00vCuGp9fkBIie0UbfddNnF2smQxZCZB6tMPZCw3GOOMkap5HZCJRLcrMCYi1MDJg6cZCLtpINRO6jHZAumyPGfuDhBmaZBdw02WYZD';

    const payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
            name: 'hello_world',
            language: {
                code: 'en_US'
            }
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

app.post('/send', async (req: Request, res: Response) => {
    const { phone } = req.body;
    try {
        await sendMessage(phone);
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
