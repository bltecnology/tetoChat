import express from "express";
import { addDepartment, deleteDepartment, getDepartments, updateDepartment } from "../controllers/departmentsController.js";

const departmentsRoutes = express.Router();

departmentsRoutes.get("/departments", getDepartments);
departmentsRoutes.post("/departments", addDepartment);
departmentsRoutes.delete("/departments/:id", deleteDepartment);
departmentsRoutes.put("/departments/:id", updateDepartment);

export { departmentsRoutes };
