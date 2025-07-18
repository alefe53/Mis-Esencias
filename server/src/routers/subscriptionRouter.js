// src/routers/subscriptionRouter.js
import { Router } from "express";
import { getAllTiers } from "../controllers/subscriptionController.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", getAllTiers);

export default subscriptionRouter;