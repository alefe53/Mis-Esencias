// src/repositories/playlistRepository.js
import { supabase } from "../config/supabase.js";

/**
 * Llama a la función de base de datos para obtener una playlist aleatoria y equitativa.
 * @param {number} moodId - El ID del mood (estado de ánimo).
 * @param {number} limit - El número máximo de canciones a devolver.
 * @param {number[]} excludeTrackIds - Un array de IDs de canciones a excluir.
 * @returns {Promise<object[]>} - Una promesa que resuelve a un array de objetos de canción.
 */
export const getRandomPlaylistFromDB = async (
	moodId,
	limit,
	excludeTrackIds,
	userTierId,
) => {
	const { data, error } = await supabase.rpc(
		"get_equitable_random_playlist_by_mood",
		{
			p_mood_id: moodId,
			p_limit: limit,
			p_exclude_track_ids: excludeTrackIds,
			p_user_subscription_tier_id: userTierId,
		},
	);

	if (error) {
		console.error("Error en Supabase RPC (playlistRepository):", error);
		throw new Error("No se pudo obtener la playlist de la base de datos.");
	}

	return data;
};
