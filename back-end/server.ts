import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import sendMessage from './services/sendMessage';

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(bodyParser.json());

let messages: any[] = []; // Array para armazenar as mensagens recebidas

// Endpoint para verificação do webhook
app.get('/webhook', (req: Request, res: Response) => {
    const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN'; // Substitua pelo seu token de verificação

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Endpoint para receber mensagens
app.post('/webhook', (req: Request, res: Response) => {
    const message = req.body;
    messages.push(message);
    console.log('Mensagem recebida:', JSON.stringify(message, null, 2));
    res.sendStatus(200);
});

// Endpoint para enviar mensagens
app.post('/send', async (req: Request, res: Response) => {
    const { phone, message } = req.body;
    try {
        await sendMessage(phone, message);
        res.status(200).send('Mensagem enviada com sucesso');
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).send(`Erro ao enviar mensagem: ${error.message}`);
        } else {
            res.status(500).send('Erro ao enviar mensagem');
        }
    }
});

// Endpoint para obter mensagens
app.get('/messages', (req: Request, res: Response) => {
    res.json(messages);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
