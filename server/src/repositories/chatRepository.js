// RUTA: src/repositories/chatRepository.js

import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";

const getOrCreateConversation = async (userId) => {
	const { data, error } = await supabase
		.rpc("get_or_create_conversation_with_admin", {
			p_user_id: userId,
			p_admin_id: config.admin.USER_ID,
		})
		.single();

	if (error) {
		console.error("Error en getOrCreateConversation RPC:", error.message);
		throw new Error("No se pudo obtener o crear la conversación.");
	}
	return data.conversation_id;
};

const getParticipantStatus = async (userId, conversationId) => {
	const { data, error } = await supabase
		.rpc("get_participant_status", {
			p_user_id: userId,
			p_conversation_id: conversationId,
		})
		.single();

	if (error) {
		console.error("Error en getParticipantStatus RPC:", error.message);
		throw new Error("No se pudo obtener el estado del participante.");
	}
	return data?.is_blocked ?? false;
};

const countMessagesSinceLastAdminReply = async (userId, conversationId) => {
	const { data, error } = await supabase.rpc(
		"count_user_messages_since_admin",
		{
			p_user_id: userId,
			p_admin_id: config.admin.USER_ID,
			p_conversation_id: conversationId,
		},
	);

	if (error) {
		console.error(
			"Error en countMessagesSinceLastAdminReply RPC:",
			error.message,
		);
		throw new Error("No se pudo contar los mensajes recientes.");
	}
	return data;
};

const insertMessage = async (messageData) => {
	const { data, error } = await supabase
		.rpc("send_message_as_user", {
			p_conversation_id: messageData.conversation_id,
			p_sender_id: messageData.sender_id,
			p_content: messageData.content,
		})
		.single();

	if (error) {
		console.error("Error en insertMessage RPC:", error.message);
		throw new Error("No se pudo enviar el mensaje.");
	}
	return data;
};

const blockParticipant = async (userId, conversationId) => {
	const { error } = await supabase.rpc("set_participant_blocked_status", {
		p_user_id: userId,
		p_conversation_id: conversationId,
		p_is_blocked: true,
	});

	if (error) {
		console.error("Error en blockParticipant RPC:", error.message);
	}
};

const getConversationMessages = async (conversationId) => {
	// --- ✨ CAMBIO AQUÍ ---
	const { data, error } = await supabase.rpc("get_conversation_messages", {
		p_conversation_id: conversationId,
		p_admin_id: config.admin.USER_ID, // Pasamos el ID del admin desde la configuración
	});

	if (error) {
		console.error("Error en getConversationMessages RPC:", error.message);
		throw new Error("No se pudieron obtener los mensajes de la conversación.");
	}
	return data;
};

const unblockParticipant = async (userId, conversationId) => {
	const { error } = await supabase.rpc("set_participant_blocked_status", {
		p_user_id: userId,
		p_conversation_id: conversationId,
		p_is_blocked: false,
	});

	if (error) {
		console.error("Error en unblockParticipant RPC:", error.message);
	}
};

const getAdminConversationList = async (adminId) => {
	const { data, error } = await supabase.rpc("get_admin_conversation_list", {
		p_admin_id: adminId,
	});

	if (error) {
		console.error("Error en getAdminConversationList RPC:", error.message);
		throw new Error("No se pudo obtener la lista de conversaciones.");
	}
	return data;
};

export const chatRepository = {
	getOrCreateConversation,
	getParticipantStatus,
	countMessagesSinceLastAdminReply,
	insertMessage,
	blockParticipant,
	getConversationMessages,
	unblockParticipant,
	getAdminConversationList,
};
