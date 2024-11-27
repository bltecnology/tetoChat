import express from "express";
import { getProfile, updateProfilePicture, upload } from "../controllers/whatsappProfileController.js";
import { authenticateJWT } from "../models/auth.js";

const whatsappProfileRoutes = express.Router();

whatsappProfileRoutes.get("/profile", authenticateJWT, getProfile);
whatsappProfileRoutes.post("/profile/picture", authenticateJWT, upload.single('file'), updateProfilePicture);

export { whatsappProfileRoutes };
