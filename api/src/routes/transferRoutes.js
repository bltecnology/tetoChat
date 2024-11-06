import express from "express";
import { transfer,
         queueStandBy,
         queueOut
        } from "../controllers/transferController.js";

const transferRoutes = express.Router();


transferRoutes.post("/transfer", transfer);
transferRoutes.get("/queue/:department", queueStandBy)
transferRoutes.delete("/queue/:department", queueOut)


export { transferRoutes };
