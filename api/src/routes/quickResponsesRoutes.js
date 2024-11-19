import express from "express";
import { addQuickResponse, getQuickResponses, updateQuickResponse, deleteQuickResponse } from "../controllers/quickResponsesController.js";

const quickResponsesRoutes = express.Router();

quickResponsesRoutes.get("/quickresponses", getQuickResponses);
quickResponsesRoutes.post("/quickresponses", addQuickResponse);
quickResponsesRoutes.put("/quickresponses/:id", updateQuickResponse);
quickResponsesRoutes.delete("/quickresponses/:id", deleteQuickResponse);

export { quickResponsesRoutes };
