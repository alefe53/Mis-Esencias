// RUTA: src/routers/chatRouter.js

import { Router } from "express";
import { chatController } from "../controllers/chatController.js";
import { requireAdminAuth } from "../middlewares/adminMiddleware.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const chatRouter = Router();

// Ruta para que un usuario obtenga su conversación con el admin
chatRouter.get(
	"/my-conversation",
	requireAuth,
	chatController.handleGetMyConversation,
);

// Ruta para admin
chatRouter.get(
	"/admin/dashboard",
	requireAuth,
	requireAdminAuth,
	chatController.handleGetAdminDashboard,
);

chatRouter.get(
	"/admin/conversation/:conversationId",
	requireAuth,
	requireAdminAuth,
	chatController.handleGetConversationById,
);

// Ruta para que un usuario envíe un mensaje al admin
chatRouter.post(
	"/send-to-admin",
	requireAuth,
	chatController.handleSendToAdmin,
);

// Ruta para que el admin responda (protegida por ambos middlewares)
chatRouter.post(
	"/admin/reply",
	requireAuth,
	requireAdminAuth,
	chatController.handleAdminReply,
);

export default chatRouter;
