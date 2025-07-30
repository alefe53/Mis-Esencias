// src/routers/adminRouter.js
import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdminAuth } from "../middlewares/adminMiddleware.js";
import * as adminController from "../controllers/adminController.js";
import { postController } from "../controllers/postController.js";

const adminRouter = Router();

adminRouter.use(requireAuth, requireAdminAuth);

adminRouter.get("/users", adminController.handleGetAllUsers);
adminRouter.delete("/chats/conversations/:conversationId", adminController.handleDeleteConversation);
adminRouter.delete("/chats/messages/:messageId", adminController.handleDeleteMessage);
adminRouter.post("/posts", postController.createPost);

adminRouter.post("/users/:userId/mute", adminController.handleToggleUserMute);
adminRouter.delete("/global-chat/:messageId", adminController.handleDeleteGlobalMessage);
adminRouter.post("/global-chat/:messageId/pin", adminController.handlePinGlobalMessage);


export default adminRouter;