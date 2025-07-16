// src/controllers/playlistController.js
import { fetchRandomPlaylist } from "../services/playlistService.js";

export const getRandomPlaylist = async (req, res, next) => {
	const { moodId, limit, excludeTrackIds } = req.query;

	const userTierId = req.user?.subscription_tier_id || 1;

	const pMoodId = Number(moodId);
	if (Number.isNaN(pMoodId)) {
		return res.status(400).json({
			success: false,
			message: "El parámetro 'moodId' es obligatorio y debe ser un número.",
		});
	}

	const pLimit = limit ? Number(limit) : 10;
	if (Number.isNaN(pLimit) || pLimit <= 0) {
		return res.status(400).json({
			success: false,
			message: "El parámetro 'limit' debe ser un número positivo.",
		});
	}

	const pExcludeTrackIds = excludeTrackIds
		? excludeTrackIds.split(",").map(Number)
		: [];
	if (pExcludeTrackIds.some(Number.isNaN)) {
		return res.status(400).json({
			success: false,
			message:
				"El parámetro 'excludeTrackIds' debe ser una lista de números separados por comas.",
		});
	}

	try {
		const playlist = await fetchRandomPlaylist(
			pMoodId,
			pLimit,
			pExcludeTrackIds,
			userTierId,
		);
		res.status(200).json({
			success: true,
			message: "Playlist generada exitosamente.",
			data: playlist,
		});
	} catch (error) {
		next(error);
	}
};
