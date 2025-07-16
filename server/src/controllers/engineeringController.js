import { engineeringService } from "../services/engineeringService.js";

const getAllProjects = async (_req, res, next) => {
	try {
		const projects = await engineeringService.fetchAllProjects();
		res.status(200).json({ success: true, data: projects });
	} catch (error) {
		next(error);
	}
};

const getProjectDetails = async (req, res, next) => {
	try {
		const { id } = req.params;
		const project = await engineeringService.fetchProjectDetails(Number(id));
		if (!project) {
			return res
				.status(404)
				.json({ success: false, message: "Proyecto no encontrado." });
		}
		res.status(200).json({ success: true, data: project });
	} catch (error) {
		next(error);
	}
};

export const engineeringController = {
	getAllProjects,
	getProjectDetails,
};
