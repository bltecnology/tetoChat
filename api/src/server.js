import express from "express";
import {contactsRoutes} from "./routes/contactsRoutes.js";
import {usersRoutes} from "./routes/usersRoutes.js";
import {departmentsRoutes} from "./routes/departmentsRoutes.js";
import {positionsRoutes} from "./routes/positionsRoutes.js";
import {queueRoutes} from "./routes/queueRoutes.js";
import {messagesRoutes} from "./routes/messagesRoutes.js";

const app = express();

app.use(express.json());

app.use(contactsRoutes);
app.use(usersRoutes);
app.use(departmentsRoutes);
app.use(positionsRoutes);
app.use(queueRoutes);
app.use(messagesRoutes);

app.listen(3005, () => console.log(`Servidor rodando na porta 3005`));
