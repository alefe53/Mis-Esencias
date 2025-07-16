//src/routers/releaseRouter.js
import { Router } from "express";
import { releaseController } from "../controllers/releaseController.js";

const releaseRouter = Router();

releaseRouter.get("/my-music", releaseController.getMySoloReleases);
releaseRouter.get("/:id", releaseController.getDetails);
releaseRouter.post("/", releaseController.createNewRelease);

export default releaseRouter;
