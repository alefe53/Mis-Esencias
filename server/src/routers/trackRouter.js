import { Router } from "express";
import { trackController } from "../controllers/trackController.js";
import { attachUserIfAuthenticated } from "../middlewares/authMiddleware.js";

const trackRouter = Router();

trackRouter.post(
	"/playable-url",
	attachUserIfAuthenticated,
	trackController.getPlayableUrl,
);

trackRouter.get(
	"/catalog",
	attachUserIfAuthenticated,
	trackController.getMusicCatalog,
);

export default trackRouter;
