import express from "express";
import { getMessages, receiveMessage, send } from "../controllers/messagesController.js";
import { authenticateUser } from "../models/auth.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", authenticateUser, getMessages);
messagesRoutes.post("/messages", authenticateUser, send);
messagesRoutes.get("/webhook", receiveMessage);

export { messagesRoutes };
