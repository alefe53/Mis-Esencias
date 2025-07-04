// src/utils/supabaseUtils.js
import { supabase } from "../config/supabase.js";

/**
 * Limpia una ruta de archivo, principalmente para quitar el slash inicial si existe.
 * @param {string} path - La ruta original.
 * @returns {string|null} - La ruta limpia o null si la entrada es nula.
 */
const cleanPath = (path) => {
  if (!path) return null;
  return path.startsWith("/") ? path.substring(1) : path;
};

/**
 * Genera una URL pública y directa para un archivo en un bucket público de Supabase.
 * Es una operación síncrona y muy rápida.
 * @param {string} bucketName - El nombre del bucket público (ej. 'assets-publicos').
 * @param {string} filePath - La ruta al archivo dentro del bucket.
 * @returns {string|null} - La URL pública directa, o null si no hay ruta.
 */
export const getPublicUrl = (bucketName, filePath) => {
  const cleanedFilePath = cleanPath(filePath);
  if (!cleanedFilePath) return null;

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(cleanedFilePath);

  return data.publicUrl;
};

/**
 * Genera una URL firmada y de corta duración para un archivo en un bucket privado.
 * @param {string} bucketName - El nombre del bucket privado (ej. 'assets-privados').
 * @param {string} filePath - La ruta al archivo dentro del bucket.
 * @returns {Promise<string|null>} - La URL firmada y temporal, o null si hay error.
 */
export const createPrivateUrl = async (bucketName, filePath) => {
  const cleanedFilePath = cleanPath(filePath);
  if (!cleanedFilePath) return null;

  const EXPIRATION_IN_SECONDS = 3600; // 1 hora de validez

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(cleanedFilePath, EXPIRATION_IN_SECONDS);

  if (error) {
    console.error(`Error generando URL firmada para ${filePath}:`, error.message);
    return null;
  }

  return data.signedUrl;
};