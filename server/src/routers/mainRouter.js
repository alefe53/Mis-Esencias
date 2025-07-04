//src/routers/mainRouter.js
import { Router } from "express";
import releaseRouter from "./releaseRouter.js"; 
import playlistRouter from './playlistRouter.js';
import moodRouter from './moodRouter.js'; 
import authRouter from './authRouter.js';
import profileRouter from './profileRouter.js';

const mainRouter = Router();

mainRouter.use("/releases", releaseRouter);
mainRouter.use('/playlists', playlistRouter);
mainRouter.use('/moods', moodRouter);
mainRouter.use('/auth', authRouter);
mainRouter.use('/profile', profileRouter);

export default mainRouter;