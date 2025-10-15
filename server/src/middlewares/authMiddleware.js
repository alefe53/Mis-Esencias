// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

/**
 * Middleware para rutas protegidas.
 * Verifica la existencia y validez de un token JWT.
 * Si el token es válido, adjunta los datos del usuario a `req.user`.
 * Si el token no existe o es inválido, devuelve un error 401.
 */
export const requireAuth = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			success: false,
			message: "Acceso denegado. Token no proporcionado.",
		});
	}

	const token = authHeader.split(" ")[1];

	try {
		const decodedUser = jwt.verify(token, config.jwt.SECRET);
		req.user = decodedUser;
		next();
	} catch (error) {
		console.error("BACKEND: ¡La verificación del token falló!", error.message);
		return res
			.status(401)
			.json({ success: false, message: "Token inválido o expirado." });
	}
};

/**
 * Middleware para rutas opcionalmente autenticadas.
 * Si hay un token válido, adjunta el usuario a `req.user`.
 * Si no hay token o es inválido, simplemente continúa sin un usuario (`req.user` será undefined).
 * Nunca bloquea la petición.
 */
export const attachUserIfAuthenticated = (req, _res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		try {
			const decodedUser = jwt.verify(token, config.jwt.SECRET);
			req.user = decodedUser;
		} catch (error) {
			console.warn("Token opcional inválido o expirado:", error.message);
		}
	}
	next();
};
