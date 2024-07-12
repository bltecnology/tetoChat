"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const sendMessage_1 = __importDefault(require("./services/sendMessage"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3005;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
let messages = []; // Array para armazenar as mensagens recebidas
// Endpoint para verificação do webhook
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN'; // Substitua pelo seu token de verificação
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
});
// Endpoint para receber mensagens
app.post('/webhook', (req, res) => {
    const message = req.body;
    messages.push(message);
    console.log('Mensagem recebida:', JSON.stringify(message, null, 2));
    res.sendStatus(200);
});
// Endpoint para enviar mensagens
app.post('/send', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, message } = req.body;
    try {
        yield (0, sendMessage_1.default)(phone, message);
        res.status(200).send('Mensagem enviada com sucesso');
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).send(`Erro ao enviar mensagem: ${error.message}`);
        }
        else {
            res.status(500).send('Erro ao enviar mensagem');
        }
    }
}));
// Endpoint para obter mensagens
app.get('/messages', (req, res) => {
    res.json(messages);
});
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
