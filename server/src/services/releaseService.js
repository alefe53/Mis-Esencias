// RUTA: src/services/releaseService.js
import { releaseRepository } from "../repositories/releaseRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";

const createRelease = async (releaseData) => {
    try {
        if (!releaseData || Object.keys(releaseData).length === 0) {
            const error = new Error("Los datos del lanzamiento no pueden estar vacíos.");
            error.statusCode = 400;
            throw error;
        }

        const result = await releaseRepository.createComprehensiveRelease(releaseData);
        
        return result;
    } catch (error) {
        console.error("Error en el servicio de lanzamientos:", error.message);
        throw error;
    }
};


const deleteReleaseById = async (releaseId) => {
    if (!releaseId || isNaN(releaseId)) {
        throw new Error("ID de lanzamiento inválido");
    }
    return await releaseRepository.deleteRelease(releaseId);
};

/**
 * Orquesta la obtención de todos los detalles de un lanzamiento.
 * @param {number} releaseId - El ID del lanzamiento.
 * @returns {Promise<object>} El objeto del lanzamiento con las URLs transformadas.
 */
const getFullReleaseDetails = async (releaseId) => {
	const release = await releaseRepository.getFullDetailsById(releaseId);

	if (!release) {
		const error = new Error("El lanzamiento no fue encontrado.");
		error.statusCode = 404;
		throw error;
	}

	const PUBLIC_BUCKET = "assets-publicos";

	release.coverArtUrl = getPublicUrl(PUBLIC_BUCKET, release.coverArtUrl);

	if (release.gallery) {
		release.gallery.forEach((img) => {
			img.imageUrl = getPublicUrl(PUBLIC_BUCKET, img.imageUrl);
		});
	}

	if (release.tracks) {
		release.tracks.forEach((track) => {
			if (track.releaseInfo?.coverArtUrl) {
				track.releaseInfo.coverArtUrl = getPublicUrl(
					PUBLIC_BUCKET,
					track.releaseInfo.coverArtUrl,
				);
			}
		});
	}

	return release;
};

const fetchMySoloReleases = async () => {
	const releases = await releaseRepository.getMySoloReleases();

	if (!releases) return [];

	const PUBLIC_BUCKET = "assets-publicos";

	return releases.map((release) => ({
		...release,
		coverArtUrl: getPublicUrl(PUBLIC_BUCKET, release.coverArtUrl),
	}));
};

export const releaseService = {
	createRelease,
	deleteReleaseById,
	getFullReleaseDetails,
	fetchMySoloReleases,
};
