// src/routers/profileRouter.js

import { Router } from 'express';
import * as profileController from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const profileRouter = Router();

profileRouter.get('/', requireAuth, profileController.getCurrentUserProfile);

profileRouter.put('/', requireAuth, profileController.updateCurrentUserProfile);

export default profileRouter;