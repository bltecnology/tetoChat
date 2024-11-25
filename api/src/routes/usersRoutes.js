import express from "express";
import { addUser, getUsers, updateUser, updateProfilePicture } from "../controllers/usersController.js";
import { authenticateJWT } from "../models/auth.js";

const usersRoutes = express.Router();

usersRoutes.get("/users", getUsers);
usersRoutes.post("/users", addUser);
usersRoutes.put("/users/:id", updateUser);
usersRoutes.post("/updateProfilePicture", upload.single("photo"), updateProfilePicture);


export { usersRoutes };
