import express from "express";
import { getUsers, updateUser } from "../controllers/usersController.js";

const usersRoutes = express.Router();

usersRoutes.get("/users", getUsers);
usersRoutes.put("/users/:id", updateUser);

export { usersRoutes };
