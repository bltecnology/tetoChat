const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

let messages = [];

app.post('/webhook', (req, res) => {
    const message = req.body;
    messages.push(message);
    console.log('Mensagem recebida:', message);
    res.sendStatus(200);
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
