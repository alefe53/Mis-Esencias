import { supabase } from "../config/supabase.js";

/**
 * Llama a la función de PostgreSQL 'fn_create_full_release' para crear un nuevo lanzamiento completo.
 * @param {object} releaseData - El objeto JSONB que contiene todos los datos del lanzamiento.
 * @returns {Promise<object>} El resultado devuelto por la función de la base de datos.
 */
const createFullRelease = async (releaseData) => {
	const { data, error } = await supabase.rpc("fn_create_full_release", {
		p_release_data: releaseData,
	});

	if (error) {
		console.error("Error en el repositorio al llamar a la función:", error);
		throw new Error(
			`Error de base deatos: ${error.message || "No se pudo crear el lanzamiento."}`,
		);
	}

	return data;
};

export const releaseRepository = {
	createFullRelease,
};