// src/auth/authRouter.js
import { Router } from "express";
import authController from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/google/callback", authController.handleGoogleCallback);

export default authRouter;
