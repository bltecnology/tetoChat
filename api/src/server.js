import express from "express";
import cors from "cors";
import { contactsRoutes } from "./routes/contactsRoutes.js";
import { usersRoutes } from "./routes/usersRoutes.js";
import { departmentsRoutes } from "./routes/departmentsRoutes.js";
import { positionsRoutes } from "./routes/positionsRoutes.js";
import { messagesRoutes } from "./routes/messagesRoutes.js";
import { loginRoutes } from "./routes/loginRoutes.js";
import { transferRoutes } from "./routes/transferRoutes.js";
import { quickResponsesRoutes } from "./routes/quickResponsesRoutes.js";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://ec2-52-67-45-214.sa-east-1.compute.amazonaws.com","http://localhost:5173","https://tetochat-k3bt.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io" // Define o path explicitamente
});

global.io = io;

app.use(cors({
    origin: ["http://ec2-52-67-45-214.sa-east-1.compute.amazonaws.com","http://localhost:5173","https://tetochat-k3bt.onrender.com"], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));

app.use(express.json());

app.use(loginRoutes)
app.use(contactsRoutes);
app.use(usersRoutes);
app.use(departmentsRoutes);
app.use(positionsRoutes);
app.use(messagesRoutes);
app.use(transferRoutes);
app.use(quickResponsesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  socket.on("error", (error) => {
    console.error("Erro no Socket.IO:", error);
  });
});

server.listen(3001, () => console.log(`Servidor rodando na porta 3001`));
