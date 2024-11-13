import express from "express";
import { addContact, deleteContact, getContacts, getUserChats } from "../controllers/contactsController.js";

const contactsRoutes = express.Router();

contactsRoutes.get("/getUserChats/:department", getUserChats)
contactsRoutes.get("/contacts", getContacts)
contactsRoutes.post("/contacts", addContact);
contactsRoutes.delete("/contacts/:id", deleteContact);

export { contactsRoutes };
