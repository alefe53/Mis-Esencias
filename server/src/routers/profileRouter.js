// src/routers/profileRouter.js

import { Router } from "express";
import * as profileController from "../controllers/profileController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const profileRouter = Router();

profileRouter.get("/", requireAuth, profileController.getCurrentUserProfile);

profileRouter.put("/", requireAuth, profileController.updateCurrentUserProfile);

profileRouter.post(
	"/avatar",
	requireAuth,
	upload.single("avatar"),
	profileController.uploadAvatar,
);

profileRouter.post(
	"/password",
	requireAuth,
	profileController.handleUpdatePassword,
);

export default profileRouter;
