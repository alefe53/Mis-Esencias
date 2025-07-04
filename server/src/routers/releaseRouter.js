//src/routers/releaseRouter.js
import { Router } from "express";
import { releaseController } from "../controllers/releaseController.js";

const releaseRouter = Router();

releaseRouter.post("/", releaseController.createNewRelease);

export default releaseRouter;