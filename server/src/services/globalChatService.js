import { config } from "../config/config.js";
import { globalChatRepository } from "../repositories/globalChatRepository.js";
import {
	broadcastRealtimeEvent,
	getPublicUrl,
} from "../utils/supabaseUtils.js";

const fetchMessages = async (limit, cursor) => {
	const messages = await globalChatRepository.getMessagesFromDB(limit, cursor);
	return messages.map((msg) => {
		if (msg.author.avatarUrl) {
			msg.author.avatarUrl = getPublicUrl(
				config.supabase.buckets.PUBLIC,
				msg.author.avatarUrl,
			);
		}
		return msg;
	});
};

const postMessage = async (authToken, content, parentId, wantsToPin) => {
	const rawNewMessage = await globalChatRepository.sendMessageToDB(
		authToken,
		content,
		parentId,
		wantsToPin,
	);

	if (!rawNewMessage || !rawNewMessage.id) {
		const error = new Error(
			"No se pudo crear el mensaje en la base de datos o no se recibió una respuesta válida.",
		);
		error.statusCode = 500;
		throw error;
	}

	await broadcastRealtimeEvent("global_chat_realtime", "new_message", {
		id: rawNewMessage.id,
	});

	const fullNewMessage = await fetchSingleMessage(rawNewMessage.id);
	return fullNewMessage;
};

const toggleReaction = async (authToken, messageId, emoji) => {
	return globalChatRepository.toggleReactionInDB(authToken, messageId, emoji);
};

const fetchSingleMessage = async (messageId) => {
	const message = await globalChatRepository.getSingleMessageFromDB(messageId);
	if (message.author.avatarUrl) {
		message.author.avatarUrl = getPublicUrl(
			config.supabase.buckets.PUBLIC,
			message.author.avatarUrl,
		);
	}
	return message;
};

export const globalChatService = {
	fetchMessages,
	postMessage,
	toggleReaction,
	fetchSingleMessage,
};
