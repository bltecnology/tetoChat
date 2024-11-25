import express from "express";
import { addUser, getUsers, updateUser, updateProfilePicture, upload } from "../controllers/usersController.js";
import { authenticateJWT } from "../models/auth.js";

const usersRoutes = express.Router();

usersRoutes.get("/users", getUsers);
usersRoutes.post("/users", addUser);
usersRoutes.put("/users/:id", updateUser);
usersRoutes.post("/updateProfilePicture", upload.single("file"), updateProfilePicture);


export { usersRoutes };
