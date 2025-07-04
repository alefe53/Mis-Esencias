// src/routers/playlistRouter.js
import { Router } from "express";
import { getRandomPlaylist } from "../controllers/playlistController.js";
import { attachUserIfAuthenticated  } from "../middlewares/authMiddleware.js";

const playlistRouter = Router();

playlistRouter.get("/", attachUserIfAuthenticated, getRandomPlaylist);

export default playlistRouter;