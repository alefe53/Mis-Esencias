// src/utils/supabaseUtils.js
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/config.js";
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
		console.error(
			`Error generando URL firmada para ${filePath}:`,
			error.message,
		);
		return null;
	}

	return data.signedUrl;
};

/**
 * Genera múltiples URLs firmadas para un array de rutas de archivo.
 * Usada específicamente por servicios que manejan galerías o listas de archivos privados.
 * @param {string} bucketName - El nombre del bucket privado.
 * @param {string[]} filePaths - Un array de rutas a los archivos.
 * @returns {Promise<object[]|null>} Un array de objetos { path, signedUrl }, o null si hay error.
 */
export const createMultipleSignedUrls = async (bucketName, filePaths) => {
	if (!filePaths || filePaths.length === 0) return [];

	// Usamos el cliente 'supabase' principal con la SERVICE_KEY para firmar
	const { data, error } = await supabase.storage
		.from(bucketName)
		.createSignedUrls(filePaths, 300); // 5 minutos de validez

	if (error) {
		console.error(
			`Error generando múltiples URLs firmadas para ${bucketName}:`,
			error.message,
		);
		return null;
	}
	return data;
};

/**
 * Crea un cliente de Supabase temporal que actúa en nombre de un usuario específico.
 * Esencial para que las RLS se apliquen correctamente en las llamadas desde el backend.
 * @param {string} userAuthToken - El token JWT del usuario.
 * @returns Un nuevo cliente de Supabase autenticado como el usuario.
 */
export const createScopedClient = (userAuthToken) => {
	if (!userAuthToken) {
		throw new Error(
			"Se requiere un token de autenticación de usuario para crear un cliente enfocado.",
		);
	}
	return createClient(config.supabase.URL, config.supabase.SERVICE_KEY, {
		global: { headers: { Authorization: `Bearer ${userAuthToken}` } },
		db: { schema: "api" },
	});
};

export const broadcastRealtimeEvent = async (
	channelName,
	eventName,
	payload,
) => {
	try {
		const channel = supabase.channel(channelName);
		const status = await channel.send({
			type: "broadcast",
			event: eventName,
			payload: payload,
		});
		if (status !== "ok") {
			console.warn(`Supabase broadcast status no fue 'ok': ${status}`);
		}
	} catch (error) {
		console.error("Error al transmitir evento de Supabase Realtime:", error);
	}
};
