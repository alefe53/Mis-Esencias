// src/routers/playlistRouter.js
import { Router } from "express";
import { getRandomPlaylist } from "../controllers/playlistController.js";
import { authenticateToken } from "../middlewares/authentication.js";

const playlistRouter = Router();

playlistRouter.get("/", authenticateToken, getRandomPlaylist);

export default playlistRouter;