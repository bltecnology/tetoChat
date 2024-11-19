import express from "express";
import { addContact, deleteContact, getContacts, getUserChats, updateStage, getStage } from "../controllers/contactsController.js";

const contactsRoutes = express.Router();

contactsRoutes.get("/getUserChats/:department", getUserChats)
contactsRoutes.get("/contacts", getContacts)
contactsRoutes.post("/contacts", addContact);
contactsRoutes.delete("/contacts/:id", deleteContact);

contactsRoutes.get("/contacts/stage/:id", getStage);
contactsRoutes.put("/contacts/stage/:id", updateStage);


export { contactsRoutes };
