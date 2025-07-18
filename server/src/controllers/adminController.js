// src/controllers/adminController.js
import * as adminService from "../services/adminService.js";

export const handleGetAllUsers = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];

        const users = await adminService.getAllUsers(token);

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const handleDeleteConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        await adminService.deleteConversation(conversationId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const handleDeleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        await adminService.deleteMessage(messageId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

