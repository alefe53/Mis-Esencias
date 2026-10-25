// src/controllers/bandController.js
import { bandService } from "../services/bandService.js";

const getAllBands = async (_req, res, next) => {
	try {
		const bands = await bandService.fetchAllBandsWithDetails();
		res.status(200).json({
			success: true,
			message: "Bandas obtenidas exitosamente.",
			data: bands,
		});
	} catch (error) {
		next(error);
	}
};

export const bandController = {
	getAllBands,
};
