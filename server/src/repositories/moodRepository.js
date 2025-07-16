// src/repositories/moodRepository.js
import { supabase } from "../config/supabase.js";

class MoodRepository {
	async getAll() {
		const { data, error } = await supabase.rpc("get_all_moods");

		if (error) {
			console.error("Error en el repositorio al obtener moods:", error);
			throw new Error("No se pudieron obtener los estados de ánimo.");
		}

		return data;
	}
}

export default new MoodRepository();
