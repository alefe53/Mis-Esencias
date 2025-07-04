import { getRandomPlaylistFromDB } from "../repositories/playlistRepository.js";
import { supabase } from "../config/supabase.js";

/**
 * Genera una URL firmada y de corta duración para un archivo de audio privado.
 * @param {string} filePath - La ruta completa al archivo dentro del bucket.
 * @returns {Promise<string|null>} - La URL firmada y temporal, o null si hay un error.
 */
const createPrivateUrl = async (filePath) => {
  if (!filePath) return null;

  const BUCKET_NAME = 'assets-privados';
  const EXPIRATION_IN_SECONDS = 3600; // La URL será válida por 1 hora

  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, EXPIRATION_IN_SECONDS);

  if (error) {
    console.error(`Error generando URL firmada para ${filePath}:`, error.message);
    return null;
  }

  return data.signedUrl;
};

/**
 * Lógica de negocio para obtener una playlist aleatoria con URLs seguras.
 */
export const fetchRandomPlaylist = async (moodId, limit, excludeTrackIds = [], userTierId) => {
  try {

    const playlistFromDB = await getRandomPlaylistFromDB(moodId, limit, excludeTrackIds, userTierId);

    if (!playlistFromDB || playlistFromDB.length === 0) {
      return [];
    }

    const playlistWithSignedUrls = await Promise.all(
      playlistFromDB.map(async (track) => {
        const playableUrl = await createPrivateUrl(track.filePath);
        
        const signedCoverUrl = await createPrivateUrl(track.releaseInfo.coverArtUrl);

        return {
          ...track, 
          playableUrl: playableUrl, 
          releaseInfo: {
            ...track.releaseInfo,
            coverArtUrl: signedCoverUrl,
          }
        };
      })
    );

    return playlistWithSignedUrls;

  } catch (error) {
    console.error("Error en playlistService:", error.message);
    throw error;
  }
};
