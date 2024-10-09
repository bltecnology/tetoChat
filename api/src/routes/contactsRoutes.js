import express from "express";
import { addContact, deleteContact } from "../controllers/contactsController.js";

const contactsRoutes = express.Router();

contactsRoutes.post("/contacts", addContact);
contactsRoutes.delete("/contacts/:id", deleteContact);

export { contactsRoutes };
