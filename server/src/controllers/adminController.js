//src/controllers/adminController.js
import * as adminService from "../services/adminService.js";
import { releaseService } from "../services/releaseService.js";

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

export const handleToggleUserMute = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization.split(" ")[1];
        const { userId } = req.params;
        const { isMuted } = req.body;
        await adminService.toggleUserMute(authToken, userId, isMuted);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const handleDeleteGlobalMessage = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization.split(" ")[1];
        const { messageId } = req.params;
        await adminService.deleteGlobalMessage(authToken, messageId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const handlePinGlobalMessage = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization.split(" ")[1];
        const { messageId } = req.params;
        const { unpin = false } = req.body;
        await adminService.pinGlobalMessage(authToken, messageId, unpin);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const handleUpdatePost = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization.split(" ")[1];
        const { postId } = req.params;
        const { title, content } = req.body;
        const result = await adminService.updatePost(authToken, postId, title, content);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const handleUpdateComment = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization.split(" ")[1];
        const { commentId } = req.params;
        const { content } = req.body;
        const result = await adminService.updateComment(authToken, commentId, content);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const handleDeleteRelease = async (req, res, next) => {
    try {
        const { releaseId } = req.params;
        await releaseService.deleteReleaseById(releaseId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};