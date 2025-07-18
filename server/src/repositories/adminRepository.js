// RUTA: src/repositories/adminRepository.js

import { createScopedClient } from "../utils/supabaseUtils.js";

/**
 * Llama a la función RPC para obtener la lista de todos los usuarios.
 * @param {string} authToken - El token JWT del usuario (admin) que realiza la solicitud.
 * @returns {Promise<object[]>}
 */
export const getAllUsersFromDB = async (authToken) => {
    const supabaseScoped = createScopedClient(authToken);

    const { data, error } = await supabaseScoped.rpc("admin_get_all_users");

    if (error) {
        console.error("Error en RPC (admin_get_all_users):", error);
        throw new Error("No se pudo obtener la lista de usuarios.");
    }

    return data;
};