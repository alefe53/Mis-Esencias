// src/repositories/subscriptionRepository.js
import { supabase } from "../config/supabase.js";

/**
 * Llama a la función de base de datos 'get_all_subscription_tiers' para obtener
 * todos los niveles de suscripción.
 * @returns {Promise<object[]>} Una promesa que resuelve a un array con los tiers.
 */
export const getAllTiersFromDB = async () => {
    const { data, error } = await supabase.rpc("get_all_subscription_tiers");

    if (error) {
        console.error("Error en RPC (get_all_subscription_tiers):", error.message);
        throw new Error("No se pudieron obtener los niveles de suscripción desde la base de datos.");
    }

    return data;
};