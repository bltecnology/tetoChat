import express from "express";
import { addPosition, deletePosition, getPositions } from "../controllers/positionsController.js";

const positionsRoutes = express.Router();

positionsRoutes.get("/positions", getPositions);
positionsRoutes.post("/positions", addPosition);
positionsRoutes.delete("/positions/:id", deletePosition);

export { positionsRoutes };
