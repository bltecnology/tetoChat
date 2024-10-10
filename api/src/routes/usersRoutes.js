import express from "express";
import { addUser, getUsers, updateUser } from "../controllers/usersController.js";

const usersRoutes = express.Router();

usersRoutes.get("/users", getUsers);
usersRoutes.post("/users", addUser);
usersRoutes.put("/users/:id", updateUser);

export { usersRoutes };
