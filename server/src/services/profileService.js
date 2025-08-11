import axios from 'axios';
import { supabase } from '../config/supabase.js';
import { config } from '../config/config.js';
import * as profileRepository from '../repositories/profileRepository.js';

/**
 * Sube un buffer de imagen a Supabase Storage.
 * @param {string} userId - El ID del usuario.
 * @param {Buffer} buffer - El buffer de datos de la imagen.
 * @param {string} contentType - El tipo MIME de la imagen.
 * @returns {Promise<string>} La ruta del archivo subido.
 */
async function uploadAvatarToStorage(userId, buffer, contentType) {
  const filePath = `users/${userId}/avatar.jpg`;

  const { data, error } = await supabase.storage
    .from(config.supabase.buckets.PUBLIC)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Error al subir avatar para ${userId}:`, error.message);
    throw new Error('No se pudo subir la imagen del avatar.');
  }

  return data.path;
}

/**
 * Función principal y única para actualizar el avatar de un usuario,
 * ya sea desde un archivo o desde una URL de Google.
 * @param {string} userId - El ID del usuario.
 * @param {object} source - Objeto que contiene { buffer, contentType } O { url }.
 * @returns {Promise<object>} El perfil actualizado.
 */
export async function updateAvatar(userId, source) {
  let imageBuffer;
  let imageContentType;
  const defaultAvatarPath = 'perfildefault.jpg';

  // Si la fuente es una URL (de Google)
  if (source.url) {
    // ▼▼▼ ESTA ES LA LÓGICA CORREGIDA Y PRECISA ▼▼▼
    // Las fotos reales de usuarios en Google suelen contener '/a-/' en la URL.
    // Las que son solo una letra por defecto, no tienen ese guion.
    const isRealGooglePhoto = source.url && source.url.includes('/a-/');

    if (!isRealGooglePhoto) {
      // Si no es una foto real, asignamos la nuestra por defecto y terminamos.
      return profileRepository.updateAvatar(userId, defaultAvatarPath);
    }
    // ▲▲▲ FIN DE LA LÓGICA CORREGIDA ▲▲▲

    try {
      const response = await axios.get(source.url, { responseType: 'arraybuffer' });
      imageBuffer = response.data;
      imageContentType = response.headers['content-type'];
    } catch (error) {
      console.error(`Error descargando avatar desde URL para ${userId}:`, error.message);
      // Si falla la descarga, asignamos el avatar por defecto.
      return profileRepository.updateAvatar(userId, defaultAvatarPath);
    }
  }
  // Si la fuente es un buffer (subida manual)
  else if (source.buffer) {
    imageBuffer = source.buffer;
    imageContentType = source.contentType;
  }
  // Si no hay fuente válida
  else {
    throw new Error('Fuente de avatar no válida.');
  }

  // Sube la imagen y obtiene la ruta
  const newPath = await uploadAvatarToStorage(userId, imageBuffer, imageContentType);

  // Actualiza la base de datos con la nueva ruta
  const updatedProfile = await profileRepository.updateAvatar(userId, newPath);
  
  return updatedProfile;
}

// --- El resto de las funciones de tu servicio ---

export async function getUserProfile(userId) {
  const profile = await profileRepository.getProfileById(userId);
  if (!profile) {
    throw new Error('Perfil no encontrado.');
  }
  return profile;
}

export async function updateUserProfile(userId, dataToUpdate) {
  return profileRepository.updateProfile(userId, dataToUpdate);
}

export const updateUserPassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    const error = new Error('La contraseña debe tener al menos 6 caracteres.');
    error.statusCode = 400;
    throw error;
  }
  return profileRepository.updatePasswordInDB(userId, newPassword);
};