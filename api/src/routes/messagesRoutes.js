import express from "express";
import { getMessages, getWehook, receiveMessage, send } from "../controllers/messagesController.js";
import { authenticateJWT } from "../models/auth.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", authenticateJWT, getMessages);
messagesRoutes.post("/send", authenticateJWT, send);
messagesRoutes.post("/webhook", receiveMessage);
messagesRoutes.get("/webhook", getWehook)

export { messagesRoutes };
