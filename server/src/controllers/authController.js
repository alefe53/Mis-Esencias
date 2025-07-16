// src/auth/authController.js
import authService from "../auth/authService.js";

class AuthController {
	async register(req, res, next) {
		try {
			const data = await authService.register(req.body);
			res.status(201).json({
				success: true,
				message:
					"Usuario registrado exitosamente. Por favor, verifica tu email.",
				data,
			});
		} catch (error) {
			next(error);
		}
	}

	async login(req, res, next) {
		try {
			const { token, user } = await authService.login(req.body);
			res.status(200).json({ success: true, token, user });
		} catch (error) {
			next(error);
		}
	}
}

export default new AuthController();
