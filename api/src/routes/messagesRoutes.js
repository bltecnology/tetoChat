import express from "express";
import { addMessage, deleteMessage, getMessages } from "../controllers/messagesController.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", getMessages);
messagesRoutes.post("/messages", addMessage);
messagesRoutes.delete("/messages/:id", deleteMessage);

export { messagesRoutes };
