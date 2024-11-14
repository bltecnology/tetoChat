import express from "express";
import { addUser, getUsers, updateUser, updatePassword, getOneUser } from "../controllers/usersController.js";

const usersRoutes = express.Router();

usersRoutes.get("/users", getUsers);
usersRoutes.post("/users", addUser);
usersRoutes.put("/users/:id", updateUser);
usersRoutes.patch("/users/:id", updatePassword);
usersRoutes.get("/users/:id", getOneUser);

export { usersRoutes };
