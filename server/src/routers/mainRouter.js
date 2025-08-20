//src/routers/mainRouter.js
import { Router } from "express";
import adminRouter from "./adminRouter.js";
import authRouter from "./authRouter.js";
import bandRouter from "./bandRouter.js";
import chatRouter from "./chatRouter.js";
import engineeringRouter from "./engineeringRouter.js";
import globalChatRouter from "./globalChatRouter.js";
import imageRouter from "./imageRouter.js";
import moodRouter from "./moodRouter.js";
import playlistRouter from "./playlistRouter.js";
import postRouter from "./postRouter.js";
import profileRouter from "./profileRouter.js";
import releaseRouter from "./releaseRouter.js";
import subscriptionRouter from "./subscriptionRouter.js";
import trackRouter from "./trackRouter.js";
import streamingRouter from './streamingRouter.js';
import paymentRouter from "./paymentRouter.js";

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
mainRouter.use("/public/subscriptions", subscriptionRouter);
mainRouter.use("/images", imageRouter);
mainRouter.use("/admin", adminRouter);
mainRouter.use("/posts", postRouter);
mainRouter.use("/global-chat", globalChatRouter);
mainRouter.use('/streaming', streamingRouter);
mainRouter.use('/payments', paymentRouter);

export default mainRouter;
