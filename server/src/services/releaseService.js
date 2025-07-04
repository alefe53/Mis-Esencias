import { releaseRepository } from "../repositories/releaseRepository.js";

/**
 * Orquesta la creación de un nuevo lanzamiento.
 * @param {object} releaseData - Los datos del lanzamiento a crear.
 * @returns {Promise<object>} El resultado de la creación del lanzamiento.
 */
const createRelease = async (releaseData) => {
	try {
		if (!releaseData || Object.keys(releaseData).length === 0) {
			const error = new Error("Los datos del lanzamiento no pueden estar vacíos.");
			error.statusCode = 400; 
			throw error;
		}

		const result = await releaseRepository.createFullRelease(releaseData);
		return result;
	} catch (error) {
		console.error("Error en el servicio de lanzamientos:", error.message);
		throw error;
	}
};

export const releaseService = {
	createRelease,
};