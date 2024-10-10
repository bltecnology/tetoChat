import express from "express";
import { addPosition, deletePosition, editPosition, getPositions } from "../controllers/positionsController.js";

const positionsRoutes = express.Router();

positionsRoutes.get("/positions", getPositions);
positionsRoutes.post("/positions", addPosition);
positionsRoutes.delete("/positions/:id", deletePosition);
positionsRoutes.put("/positions/:id", editPosition);

export { positionsRoutes };
