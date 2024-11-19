import express from "express";
import { addQuickResponse, getQuickResponses, updateQuickResponse, deleteQuickResponse } from "../controllers/quickResponsesController.js";
import { authenticateJWT } from "../models/auth.js";

const quickResponsesRoutes = express.Router();

quickResponsesRoutes.get("/quickresponses", authenticateJWT, getQuickResponses);
quickResponsesRoutes.post("/quickresponses", authenticateJWT, addQuickResponse);
quickResponsesRoutes.put("/quickresponses/:id", authenticateJWT, updateQuickResponse);
quickResponsesRoutes.delete("/quickresponses/:id", authenticateJWT, deleteQuickResponse);

export { quickResponsesRoutes };
