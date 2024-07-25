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
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("./database"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
const VERIFY_TOKEN = 'blchat';
let messages = [];
const getProfilePicture = (phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    if (!token || !whatsappBusinessAccountId) {
        throw new Error("As variáveis de ambiente WHATSAPP_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID são necessárias.");
    }
    try {
        const response = yield axios_1.default.get(`https://graph.facebook.com/v13.0/${whatsappBusinessAccountId}/contacts`, {
            params: {
                phone_number: phoneNumber
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const profilePictureUrl = ((_a = response.data.data[0]) === null || _a === void 0 ? void 0 : _a.profile_picture_url) || null;
        return profilePictureUrl;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Erro ao obter a imagem do perfil:', error.response ? error.response.data : error.message);
        }
        else {
            console.error('Erro desconhecido ao obter a imagem do perfil:', error);
        }
        throw error;
    }
});
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
            res.status(403).send('Forbidden');
        }
    }
    else {
        res.status(400).send('Bad Request');
    }
});
app.post('/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    console.log('Recebido webhook:', JSON.stringify(body, null, 2));
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach((entry) => __awaiter(void 0, void 0, void 0, function* () {
            entry.changes.forEach((change) => __awaiter(void 0, void 0, void 0, function* () {
                if (change.value.messages) {
                    for (const message of change.value.messages) {
                        console.log('Mensagem recebida:', message);
                        try {
                            const [result] = yield database_1.default.execute('INSERT INTO messages (from, content) VALUES (?, ?)', [message.from, message.text ? message.text.body : '']);
                            console.log(`Mensagem salva no banco de dados. ID: ${result.insertId}`);
                        }
                        catch (error) {
                            console.error('Erro ao salvar mensagem no banco de dados:', error);
                        }
                        messages.push({
                            from: message.from,
                            content: message.text ? message.text.body : message,
                        });
                    }
                }
            }));
        }));
        res.status(200).send('EVENT_RECEIVED');
    }
    else {
        res.sendStatus(404);
    }
}));
app.get('/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_1.default.execute('SELECT * FROM messages');
        res.json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).send('Erro ao buscar mensagens');
    }
}));
app.get('/profile-picture', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).send('Número de telefone é obrigatório');
    }
    try {
        const profilePictureUrl = yield getProfilePicture(phone);
        res.json({ profilePictureUrl });
    }
    catch (error) {
        res.status(500).send('Erro ao obter a imagem do perfil');
    }
}));
app.post('/contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phone, tag, note, cpf, rg, email } = req.body;
    if (!name || !phone) {
        return res.status(400).send('Nome e telefone são obrigatórios');
    }
    try {
        const [result] = yield database_1.default.execute('INSERT INTO contacts (name, phone, tag, note, cpf, rg, email) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, phone, tag, note, cpf, rg, email]);
        const insertId = result.insertId;
        res.status(201).send(`Contato adicionado com sucesso. ID: ${insertId}`);
    }
    catch (error) {
        console.error('Erro ao salvar contato:', error);
        res.status(500).send('Erro ao salvar contato');
    }
}));
// Nova rota para buscar todos os contatos
app.get('/contacts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_1.default.execute('SELECT * FROM contacts');
        res.json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).send('Erro ao buscar contatos');
    }
}));
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
