import { getRandomPlaylistFromDB } from "../repositories/playlistRepository.js";
import { createPrivateUrl, getPublicUrl } from "../utils/supabaseUtils.js";

const PUBLIC_BUCKET = "assets-publicos";
const PRIVATE_BUCKET = "assets-privados";
const FREE_TIER_ID = 1;

/**
 * Helper para transformar una canción, añadiendo la URL correcta (pública o privada).
 * @param {object} track - La canción de la base de datos.
 * @param {number} userTierId - El nivel de suscripción del usuario actual.
 * @returns {Promise<object>} - La canción transformada con URLs listas para usar.
 */
const _transformTrackWithPlayableUrls = async (track, _userTierId) => {
	const isExclusive = track.required_subscription_tier_id > FREE_TIER_ID;

	let playableUrl;

	if (isExclusive) {
		playableUrl = await createPrivateUrl(PRIVATE_BUCKET, track.filePath);
	} else {
		playableUrl = getPublicUrl(PUBLIC_BUCKET, track.filePath);
	}

	const publicCoverUrl = getPublicUrl(
		PUBLIC_BUCKET,
		track.releaseInfo.coverArtUrl,
	);

	return {
		...track,
		playableUrl,
		releaseInfo: {
			...track.releaseInfo,
			coverArtUrl: publicCoverUrl,
		},
	};
};

export const fetchRandomPlaylist = async (
	moodId,
	limit,
	excludeTrackIds = [],
	userTierId,
) => {
	try {
		const playlistFromDB = await getRandomPlaylistFromDB(
			moodId,
			limit,
			excludeTrackIds,
			userTierId,
		);

		if (!playlistFromDB || playlistFromDB.length === 0) {
			return [];
		}

		return Promise.all(
			playlistFromDB.map((track) =>
				_transformTrackWithPlayableUrls(track, userTierId),
			),
		);
	} catch (error) {
		console.error("Error en playlistService:", error.message);
		throw error;
	}
};
