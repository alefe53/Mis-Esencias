// RUTA: src/services/adminService.js (BACKEND)

import { config } from "../config/config.js";
import * as adminRepository from "../repositories/adminRepository.js";
import { chatRepository } from "../repositories/chatRepository.js";
import { getPublicUrl } from "../utils/supabaseUtils.js";

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

export const toggleUserMute = (authToken, userId, isMuted) => {
	return adminRepository.toggleUserMuteInDB(authToken, userId, isMuted);
};

export const deleteGlobalMessage = (authToken, messageId) => {
	return adminRepository.deleteGlobalMessageInDB(authToken, messageId);
};

export const pinGlobalMessage = (authToken, messageId, unpin) => {
	return adminRepository.pinGlobalMessageInDB(authToken, messageId, unpin);
};
