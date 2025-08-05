// RUTA: src/routers/postRouter.js

import { Router } from "express";
import { postController } from "../controllers/postController.js";
import { requireAdminAuth } from "../middlewares/adminMiddleware.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireSubscription } from "../middlewares/subscriptionCheck.js";

const postRouter = Router();

// Todas las rutas del muro requieren que el usuario esté autenticado
postRouter.use(requireAuth);

// --- Rutas para Usuarios ---
postRouter.get("/", postController.getSocialFeed);
postRouter.post("/:postId/like", postController.toggleLike);
postRouter.post(
	"/:postId/comments",
	requireSubscription(2),
	postController.addComment,
); // Requiere tier 2 para comentar
postRouter.post("/:postId/vote", postController.castVote);

// --- Rutas para Administrador ---
postRouter.delete("/:postId", requireAdminAuth, postController.deletePost);
postRouter.delete(
	"/comments/:commentId",
	requireAdminAuth,
	postController.deleteComment,
);

export default postRouter;
