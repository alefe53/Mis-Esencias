// src/routers/moodRouter.js
import { Router } from "express";
import moodController from "../controllers/moodController.js";

const moodRouter = Router();

moodRouter.get("/", moodController.getAllMoods);

export default moodRouter;
