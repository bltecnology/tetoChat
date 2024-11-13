import express from "express";
import { getMessages,
         getWebhook, 
         receiveMessage, 
         send, 
         sendFile,
         getFile, 
         upload } from "../controllers/messagesController.js";
import { authenticateJWT } from "../models/auth.js";

const messagesRoutes = express.Router();

messagesRoutes.get("/messages", authenticateJWT, getMessages);
messagesRoutes.post("/send", authenticateJWT, send);
messagesRoutes.post("/webhook", receiveMessage);
messagesRoutes.get("/webhook", getWebhook);
messagesRoutes.post('/send-file', upload.single('file'), sendFile);
messagesRoutes.get('/file/:messageId', getFile);

export { messagesRoutes };
