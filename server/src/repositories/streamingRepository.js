//src/repositories/streamingRepository.js
import { supabase } from '../config/supabase.js';
import { createScopedClient } from "../utils/supabaseUtils.js";

export const createSessionInDB = async (authToken, title, description, egressId) => {
    const supabaseScoped = createScopedClient(authToken);
    const { data, error } = await supabaseScoped.rpc("create_live_session", {
        p_title: title,
        p_description: description,
        p_egress_id: egressId,
    });

    if (error) {
        console.error("Error en RPC (create_live_session):", error);
        throw new Error("No se pudo crear el registro de la sesión en la base de datos.");
    }
    return data;
};

export const endSessionInDB = async (authToken, egressId, storagePath, duration) => {
    const supabaseScoped = createScopedClient(authToken);
    const { error } = await supabaseScoped.rpc("end_live_session", {
        p_egress_id: egressId,
        p_storage_path: storagePath,
        p_duration_seconds: duration,
    });

    if (error) {
        console.error("Error en RPC (end_live_session):", error);
        throw new Error("No se pudo finalizar el registro de la sesión.");
    }
};


export const setStreamStatusInDB = async (isLive) => {
    const { error } = await supabase.rpc('set_stream_status', { p_is_live: isLive });

    if (error) {
        console.error("Error al llamar a RPC set_stream_status:", error);
        throw new Error("No se pudo actualizar el estado del stream.");
    }
};

export const getStreamStatusFromDB = async () => {
    const { data, error } = await supabase
        .rpc('get_stream_status')
        .single();

    if (error) {
        console.error("Error al llamar a RPC get_stream_status:", error);
        throw new Error("No se pudo obtener el estado del stream.");
    }
    return data;
};