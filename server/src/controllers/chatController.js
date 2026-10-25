// RUTA: src/controllers/chatController.js

import { chatService } from "../services/chatService.js";

const handleSendToAdmin = async (req, res, next) => {
	try {
		const senderId = req.user.id;
		const { content } = req.body;
		const newMessage = await chatService.sendToAdmin(senderId, content);
		res.status(201).json({
			success: true,
			message: "Mensaje enviado correctamente.",
			data: newMessage,
		});
	} catch (error) {
		next(error);
	}
};

const handleGetMyConversation = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const conversationData = await chatService.getMyConversation(userId);
		res.status(200).json({
			success: true,
			data: conversationData,
		});
	} catch (error) {
		next(error);
	}
};

const handleAdminReply = async (req, res, next) => {
	try {
		const adminId = req.user.id;
		const { conversationId, userIdToUnblock, content } = req.body;
		const replyMessage = await chatService.replyAsAdmin(
			adminId,
			conversationId,
			userIdToUnblock,
			content,
		);
		res.status(201).json({
			success: true,
			message: "Respuesta enviada.",
			data: replyMessage,
		});
	} catch (error) {
		next(error);
	}
};

const handleGetAdminDashboard = async (req, res, next) => {
	try {
		const adminId = req.user.id;
		const conversations = await chatService.getAdminDashboard(adminId);
		res.status(200).json({
			success: true,
			data: conversations,
		});
	} catch (error) {
		next(error);
	}
};

const handleGetConversationById = async (req, res, next) => {
	try {
		const { conversationId } = req.params;
		const conversationData =
			await chatService.getConversationForAdmin(conversationId);
		res.status(200).json({ success: true, data: conversationData });
	} catch (error) {
		next(error);
	}
};
export const chatController = {
	handleSendToAdmin,
	handleGetMyConversation,
	handleAdminReply,
	handleGetAdminDashboard,
	handleGetConversationById,
};
