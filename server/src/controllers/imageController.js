// src/controllers/imageController.js
import * as imageService from "../services/imageService.js";

export const getPrivateGallery = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		const userAuthToken = authHeader?.startsWith("Bearer ")
			? authHeader.split(" ")[1]
			: null;

		if (!userAuthToken) {
			return res
				.status(401)
				.json({ success: false, message: "Token no encontrado." });
		}

		const images = await imageService.getPrivateGalleryImages(
			"info_page",
			userAuthToken,
		);

		res.status(200).json({ success: true, data: images });
	} catch (error) {
		next(error);
	}
};
