import { config } from "../config/config.js";
import { engineeringRepository } from "../repositories/engineeringRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";

const fetchAllProjects = async () => {
	const projects = await engineeringRepository.getAll();
	if (!projects) return [];

	const PUBLIC_BUCKET = config.supabase.buckets.PUBLIC;

	return projects.map((project) => ({
		...project,
		cover_art_url: getPublicUrl(PUBLIC_BUCKET, project.cover_art_url),
	}));
};

const fetchProjectDetails = async (projectId) => {
	const project = await engineeringRepository.getDetailsById(projectId);
	if (!project) return null;

	const PUBLIC_BUCKET = config.supabase.buckets.PUBLIC;

	// Transformar URL principal
	project.cover_art_url = getPublicUrl(PUBLIC_BUCKET, project.cover_art_url);

	// Transformar URLs de los releases asociados
	if (project.releases) {
		project.releases = project.releases.map((release) => ({
			...release,
			coverArtUrl: getPublicUrl(PUBLIC_BUCKET, release.coverArtUrl),
		}));
	}

	return project;
};

export const engineeringService = {
	fetchAllProjects,
	fetchProjectDetails,
};
