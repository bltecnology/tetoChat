import express from "express";
import { getMessages, receiveMessage, send } from "../controllers/messagesController.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", getMessages);
messagesRoutes.post("/messages", send);
messagesRoutes.get("/webhook", receiveMessage);

export { messagesRoutes };
