// src/repositories/imageRepository.js

/**
 * Llama a la función RPC para obtener los metadatos de una galería por su clave.
 * @param {string} galleryKey - La clave de la galería (ej. 'info_page').
 * @param {SupabaseClient} supabaseClient - El cliente de Supabase a usar (autenticado como el usuario).
 * @returns {Promise<object[]>} Una promesa que resuelve a un array de objetos de imagen.
 */
export const getGalleryByKeyFromDB = async (galleryKey, supabaseClient) => {
    const { data, error } = await supabaseClient.rpc("get_gallery_by_key", {
        p_gallery_key: galleryKey,
    });

    if (error) {
        console.error("Error en RPC (get_gallery_by_key):", error);
        throw new Error("No se pudieron obtener los datos de la galería.");
    }

    return data;
};