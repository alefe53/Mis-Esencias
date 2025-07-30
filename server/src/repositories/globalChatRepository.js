// RUTA: src/repositories/globalChatRepository.js

import { createScopedClient } from "../utils/supabaseUtils.js";
import { supabase as supabaseAdmin } from "../config/supabase.js";

const getMessagesFromDB = async (limit, cursor) => {
    const { data, error } = await supabaseAdmin.rpc("get_global_chat_history", {
        p_limit: limit,
        p_cursor: cursor,
    });

    if (error) {
        console.error("Error en RPC (get_global_chat_history):", error);
        throw new Error("No se pudo obtener el historial de mensajes.");
    }
    return data;
};

const sendMessageToDB = async (authToken, content, parentId) => {
	const scopedSupabase = createScopedClient(authToken);
	const { data, error } = await scopedSupabase
		.rpc("send_global_chat_message", {
			p_content: content,
			p_parent_message_id: parentId,
		})
		.single();

	if (error) {
		console.error("Error en RPC (send_global_chat_message):", error);
		throw new Error(error.message || "No se pudo enviar el mensaje.");
	}

	return data;
};

const toggleReactionInDB = async (authToken, messageId, emoji) => {
    const scopedSupabase = createScopedClient(authToken);
    const { data, error } = await scopedSupabase.rpc("toggle_global_chat_reaction", {
        p_message_id: messageId,
        p_emoji_char: emoji,
    });

    if (error) {
        console.error("Error en RPC (toggle_global_chat_reaction):", error);
        throw new Error("No se pudo procesar la reacción.");
    }
    return data;
};
const getSingleMessageFromDB = async (messageId) => {
    const { data, error } = await supabaseAdmin.rpc("get_single_global_chat_message", {
        p_message_id: messageId,
    });

    if (error) {
        console.error("Error en RPC (get_single_global_chat_message):", error);
        throw new Error("No se pudo obtener el mensaje.");
    }
    return data;
};

export const globalChatRepository = {
    getMessagesFromDB,
    sendMessageToDB,
    toggleReactionInDB,
    getSingleMessageFromDB,
};