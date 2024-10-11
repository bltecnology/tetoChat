import express from "express";
import { transfer } from "../controllers/transferController.js";

const queueRoutes = express.Router();


transferRoutes.post("/transfer", transfer);


export { transferRoutes };
