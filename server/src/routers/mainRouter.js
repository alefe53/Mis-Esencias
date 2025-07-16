//src/routers/mainRouter.js
import { Router } from "express";
import authRouter from "./authRouter.js";
import bandRouter from "./bandRouter.js";
import chatRouter from "./chatRouter.js";
import engineeringRouter from "./engineeringRouter.js";
import moodRouter from "./moodRouter.js";
import playlistRouter from "./playlistRouter.js";
import profileRouter from "./profileRouter.js";
import releaseRouter from "./releaseRouter.js";
import trackRouter from "./trackRouter.js";

const mainRouter = Router();

mainRouter.use("/releases", releaseRouter);
mainRouter.use("/playlists", playlistRouter);
mainRouter.use("/moods", moodRouter);
mainRouter.use("/auth", authRouter);
mainRouter.use("/profile", profileRouter);
mainRouter.use("/tracks", trackRouter);
mainRouter.use("/bands", bandRouter);
mainRouter.use("/engineering", engineeringRouter);
mainRouter.use("/chat", chatRouter);

export default mainRouter;
