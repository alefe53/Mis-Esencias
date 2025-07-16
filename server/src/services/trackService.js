import { config } from "../config/config.js";
import { trackRepository } from "../repositories/trackRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";

const fetchMusicCatalog = async (userTierId) => {
	const catalogFromDB = await trackRepository.getLocalCatalog(userTierId);
	if (!catalogFromDB) return [];

	const PUBLIC_BUCKET = config.supabase.buckets.PUBLIC;

	return catalogFromDB.map((track) => {
		const publicCoverUrl = getPublicUrl(
			PUBLIC_BUCKET,
			track.releaseInfo.coverArtUrl,
		);

		return {
			...track,
			releaseInfo: {
				...track.releaseInfo,
				coverArtUrl: publicCoverUrl,
			},
		};
	});
};

export const trackService = {
	fetchMusicCatalog,
};
