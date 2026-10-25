// RUTA: src/middlewares/admin.middleware.js
import { config } from "../config/config.js";

export const requireAdminAuth = (req, res, next) => {
	// Primero, asegura que el usuario esté autenticado
	if (!req.user) {
		return res
			.status(401)
			.json({ success: false, message: "Acceso denegado." });
	}

	// Compara el ID del usuario del token con el ID del admin de la config
	if (req.user.id !== config.admin.USER_ID) {
		return res.status(403).json({
			success: false,
			message: "Acción no permitida. Se requiere rol de administrador.",
		});
	}

	next();
};
