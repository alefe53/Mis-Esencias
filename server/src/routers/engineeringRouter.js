import { Router } from "express";
import { engineeringController } from "../controllers/engineeringController.js";

const engineeringRouter = Router();

engineeringRouter.get("/", engineeringController.getAllProjects);
engineeringRouter.get("/:id", engineeringController.getProjectDetails);

export default engineeringRouter;
