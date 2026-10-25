// src/services/bandService.js

import { config } from "../config/config.js";
import { bandRepository } from "../repositories/bandRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";

const fetchAllBandsWithDetails = async () => {
	const bands = await bandRepository.getAllBandsWithDetails();

	if (!bands) return [];

	const PUBLIC_BUCKET = config.supabase.buckets.PUBLIC;

	return bands.map((band) => {
		const bandImageUrl = getPublicUrl(PUBLIC_BUCKET, band.image_url);

		const releasesWithUrls = band.releases
			? band.releases.map((release) => ({
					...release,
					coverArtUrl: getPublicUrl(PUBLIC_BUCKET, release.cover_art_url),
				}))
			: [];

		return {
			...band,
			image_url: bandImageUrl,
			releases: releasesWithUrls,
		};
	});
};

export const bandService = {
	fetchAllBandsWithDetails,
};
