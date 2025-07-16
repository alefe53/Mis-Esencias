// src/repositories/bandRepository.js
import { supabase } from "../config/supabase.js";

const getAllBandsWithDetails = async () => {
	const { data, error } = await supabase.rpc("get_all_bands_with_details");

	if (error) {
		console.error("Error en el repositorio al obtener las bandas:", error);
		throw new Error(`Error de base de datos: ${error.message}`);
	}
	return data;
};

export const bandRepository = {
	getAllBandsWithDetails,
};
