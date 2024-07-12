"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
const VERIFY_TOKEN = 'blchat'; // Defina o token de verificação aqui
// Rota para verificação do webhook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
    }
    else {
        res.sendStatus(400);
    }
});
// Rota para receber mensagens do webhook
app.post('/webhook', (req, res) => {
    const body = req.body;
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    res.status(200).send('EVENT_RECEIVED');
});
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
