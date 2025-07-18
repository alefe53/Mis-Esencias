// RUTA: src/services/adminService.js (BACKEND)

import * as adminRepository from "../repositories/adminRepository.js";
import { chatRepository } from "../repositories/chatRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";
import { config } from "../config/config.js";

export const getAllUsers = async (authToken) => {
	const users = await adminRepository.getAllUsersFromDB(authToken);

	if (!users || users.length === 0) {
		return [];
	}

	const transformedUsers = users.map((user) => ({
		...user,
		avatar_url: getPublicUrl(config.supabase.buckets.PUBLIC, user.avatar_url),
	}));

	return transformedUsers;
};

export const deleteConversation = async (conversationId) => {
	await chatRepository.deleteConversationAsAdmin(conversationId);
};

export const deleteMessage = async (messageId) => {
	await chatRepository.deleteMessageAsAdmin(messageId);
};