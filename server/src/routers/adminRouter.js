// src/routers/adminRouter.js
import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdminAuth } from "../middlewares/adminMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const adminRouter = Router();

// Aplicamos los middlewares de seguridad a TODAS las rutas de este router.
adminRouter.use(requireAuth, requireAdminAuth);

// --- Rutas de Gestión de Usuarios ---
adminRouter.get("/users", adminController.handleGetAllUsers);

// --- Rutas de Gestión de Chats ---
adminRouter.delete("/chats/conversations/:conversationId", adminController.handleDeleteConversation);
adminRouter.delete("/chats/messages/:messageId", adminController.handleDeleteMessage);

export default adminRouter;