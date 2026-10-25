import { supabase } from "../config/supabase.js";

const getAll = async () => {
	const { data, error } = await supabase.rpc("get_all_engineering_projects");
	if (error) {
		console.error(
			"Error en el repositorio al obtener proyectos de ingeniería:",
			error,
		);
		throw new Error(`Error de base de datos: ${error.message}`);
	}
	return data;
};

const getDetailsById = async (projectId) => {
	const { data, error } = await supabase
		.rpc("get_engineering_project_details", { p_project_id: projectId })
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // No encontrado
		console.error("Error en repo al obtener detalles del proyecto:", error);
		throw new Error(`Error de base de datos: ${error.message}`);
	}
	return data;
};

export const engineeringRepository = {
	getAll,
	getDetailsById,
};
