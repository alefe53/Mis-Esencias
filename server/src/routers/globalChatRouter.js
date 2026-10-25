// RUTA: src/routers/globalChatRouter.js

import { Router } from "express";
import { globalChatController } from "../controllers/globalChatController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const globalChatRouter = Router();

// Todas las rutas del chat global requieren autenticación
globalChatRouter.use(requireAuth);

globalChatRouter.get("/", globalChatController.getChatMessages);
globalChatRouter.get("/:messageId", globalChatController.getSingleChatMessage);
globalChatRouter.post("/", globalChatController.postChatMessage);
globalChatRouter.post(
	"/:messageId/react",
	globalChatController.toggleMessageReaction,
);

export default globalChatRouter;
