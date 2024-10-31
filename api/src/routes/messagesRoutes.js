import express from "express";
import { getMessages,
         getWebhook, 
         receiveMessage, 
         send, 
         sendImageMessage, 
         getImageMessage,
         upload } from "../controllers/messagesController.js";
import { authenticateJWT } from "../models/auth.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", authenticateJWT, getMessages);
messagesRoutes.post("/send", authenticateJWT, send);
messagesRoutes.post("/webhook", receiveMessage);
messagesRoutes.get("/webhook", getWebhook);
messagesRoutes.post('/send-image', upload.single('image'), sendImageMessage);
messagesRoutes.get('/image/:messageId', getImageMessage)

export { messagesRoutes };
