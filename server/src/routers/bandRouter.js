// src/routers/bandRouter.js
import { Router } from "express";
import { bandController } from "../controllers/bandController.js";

const bandRouter = Router();

bandRouter.get("/", bandController.getAllBands);

export default bandRouter;
