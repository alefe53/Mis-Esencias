//src/streamingRouter.js
import { Router } from "express";
import * as streamingController from '../controllers/streamingController.js';
import { requireAuth, attachUserIfAuthenticated } from '../middlewares/authMiddleware.js';
import { requireAdminAuth } from '../middlewares/adminMiddleware.js';

const streamingRouter = Router();

streamingRouter.get('/token', attachUserIfAuthenticated, streamingController.getStreamingToken);
streamingRouter.get('/participants', streamingController.getParticipantCount);
streamingRouter.get('/status', streamingController.getStreamStatus);

streamingRouter.post('/start', requireAuth, requireAdminAuth, streamingController.startStream);
streamingRouter.post('/stop', requireAuth, requireAdminAuth, streamingController.stopStream);

streamingRouter.post('/record/start', requireAuth, requireAdminAuth, streamingController.handleStartRecording);
streamingRouter.post('/record/stop', requireAuth, requireAdminAuth, streamingController.handleStopRecording);

export default streamingRouter;