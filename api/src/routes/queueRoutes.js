import express from "express";
import { addQueue, deleteQueue, getQueue } from "../controllers/queueController.js";

const queueRoutes = express.Router();

queueRoutes.get("/queue", getQueue);
queueRoutes.post("/queue", addQueue);
queueRoutes.delete("/queue/:id", deleteQueue);

export { queueRoutes };
