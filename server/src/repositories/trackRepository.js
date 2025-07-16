import { supabase } from "../config/supabase.js";

const getLocalCatalog = async (userTierId) => {
	const { data, error } = await supabase.rpc("get_full_music_catalog", {
		p_user_subscription_tier_id: userTierId,
	});

	if (error) {
		console.error("Error en el repositorio al obtener el catálogo:", error);
		throw new Error(`Error de base de datos: ${error.message}`);
	}

	return data;
};

export const trackRepository = {
	getLocalCatalog,
};
