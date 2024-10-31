import express from "express";
import cors from "cors";
import {contactsRoutes} from "./routes/contactsRoutes.js";
import {usersRoutes} from "./routes/usersRoutes.js";
import {departmentsRoutes} from "./routes/departmentsRoutes.js";
import {positionsRoutes} from "./routes/positionsRoutes.js";
import {messagesRoutes} from "./routes/messagesRoutes.js";
import {loginRoutes} from "./routes/loginRoutes.js";
import { transferRoutes } from "./routes/transferRoutes.js";
import { Server } from "socket.io";
import http from "http";


const app = express();
const server = http.createServer(app);
const io = new Server(server);

global.io = io;

app.use(cors({
    origin: "http://localhost:5173", 
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
app.use(transferRoutes)

app.listen(3005, () => console.log(`Servidor rodando na porta 3005`));
