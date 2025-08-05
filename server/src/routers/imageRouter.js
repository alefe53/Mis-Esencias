// src/routers/imageRouter.js
import { Router } from "express";
import * as imageController from "../controllers/imageController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireSubscription } from "../middlewares/subscriptionCheck.js";

const imageRouter = Router();

imageRouter.get(
	"/private-gallery",
	requireAuth,
	requireSubscription(2),
	imageController.getPrivateGallery,
);

export default imageRouter;
