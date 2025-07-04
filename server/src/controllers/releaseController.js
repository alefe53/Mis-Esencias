import { releaseService } from "../services/releaseService.js";

/**
 * Maneja la petición HTTP para crear un nuevo lanzamiento.
 * @param {import('express').Request} req - El objeto de la petición.
 * @param {import('express').Response} res - El objeto de la respuesta.
 * @param {import('express').NextFunction} next - La función para pasar al siguiente middleware.
 */
const createNewRelease = async (req, res, next) => {
	try {
		const releaseData = req.body;

		const result = await releaseService.createRelease(releaseData);

		if (!result.success) {
			return res.status(400).json({
				success: false,
				message: result.message || "Hubo un problema al procesar el lanzamiento.",
				details: result.details || null,
			});
		}

		res.status(201).json(result);
	} catch (error) {
		next(error);
	}
};

export const releaseController = {
	createNewRelease,
};