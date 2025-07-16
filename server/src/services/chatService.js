// RUTA: src/services/chatService.js

import { chatRepository } from "../repositories/chatRepository.js";

const sendToAdmin = async (senderId, content) => {
	if (!content || content.trim().length === 0) {
		const error = new Error("El contenido del mensaje no puede estar vacío.");
		error.statusCode = 400;
		throw error;
	}
	if (content.length > 400) {
		const error = new Error("El mensaje no puede superar los 400 caracteres.");
		error.statusCode = 400;
		throw error;
	}

	// 1. Encontrar o crear la conversación con el nuevo método del repositorio.
	const conversationId = await chatRepository.getOrCreateConversation(senderId);

	// 2. Verificar si el usuario está bloqueado.
	const isBlocked = await chatRepository.getParticipantStatus(
		senderId,
		conversationId,
	);
	if (isBlocked) {
		const error = new Error(
			"Has alcanzado el límite de mensajes. Espera una respuesta para continuar.",
		);
		error.statusCode = 403; // Forbidden
		throw error;
	}

	// 3. Contar los mensajes recientes para aplicar la regla de los 3 mensajes.
	const recentMessagesCount =
		await chatRepository.countMessagesSinceLastAdminReply(
			senderId,
			conversationId,
		);

	if (recentMessagesCount >= 3) {
		const error = new Error(
			"Has alcanzado el límite de 3 mensajes. Espera una respuesta.",
		);
		error.statusCode = 403; // Forbidden
		throw error;
	}

	// 4. Insertar el nuevo mensaje.
	const messageData = {
		conversation_id: conversationId,
		sender_id: senderId,
		content: content,
	};
	const newMessage = await chatRepository.insertMessage(messageData);

	// 5. Si este fue el tercer mensaje, bloquear al usuario.
	if (recentMessagesCount === 2) {
		await chatRepository.blockParticipant(senderId, conversationId);
	}

	return newMessage;
};

// --- ✨ NUEVAS FUNCIONES AÑADIDAS ---

/**
 * Obtiene el historial completo de la conversación de un usuario con el admin.
 * @param {string} userId - UUID del usuario.
 * @returns {Promise<object>} Un objeto con los detalles de la conversación.
 */
const getMyConversation = async (userId) => {
	const conversationId = await chatRepository.getOrCreateConversation(userId);
	const messages = await chatRepository.getConversationMessages(conversationId);
	const isBlocked = await chatRepository.getParticipantStatus(
		userId,
		conversationId,
	);

	return {
		conversationId,
		isBlocked,
		messages,
	};
};

/**
 * Permite al admin enviar una respuesta y desbloquear al usuario.
 * @param {string} adminId - UUID del admin.
 * @param {number} conversationId - ID de la conversación a la que se responde.
 * @param {string} userIdToUnblock - UUID del usuario que será desbloqueado.
 * @param {string} content - Contenido de la respuesta.
 * @returns {Promise<object>} El mensaje de respuesta creado.
 */
const replyAsAdmin = async (
	adminId,
	conversationId,
	userIdToUnblock,
	content,
) => {
	if (!content || content.trim().length === 0) {
		const error = new Error("La respuesta no puede estar vacía.");
		error.statusCode = 400;
		throw error;
	}

	// 1. Insertar el mensaje del admin.
	const messageData = {
		conversation_id: conversationId,
		sender_id: adminId,
		content,
	};
	const adminMessage = await chatRepository.insertMessage(messageData);

	// 2. Desbloquear al otro participante.
	await chatRepository.unblockParticipant(userIdToUnblock, conversationId);

	return adminMessage;
};

const getAdminDashboard = async (adminId) => {
	return chatRepository.getAdminConversationList(adminId);
};
const getConversationForAdmin = async (conversationId) => {
	const messages = await chatRepository.getConversationMessages(conversationId);
	return { messages };
};
export const chatService = {
	sendToAdmin,
	getMyConversation,
	replyAsAdmin,
	getAdminDashboard,
	getConversationForAdmin,
};
