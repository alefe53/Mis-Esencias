// RUTA: src/controllers/globalChatController.js

import { globalChatService } from "../services/globalChatService.js";

const extractAuthToken = (req) => req.headers.authorization.split(" ")[1];

const getChatMessages = async (req, res, next) => {
    try {
        const { limit = 50, cursor } = req.query;
        const messages = await globalChatService.fetchMessages(parseInt(limit, 10), cursor);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

const postChatMessage = async (req, res, next) => {
    try {
        const { content, parentId } = req.body;
        const authToken = extractAuthToken(req);
        const newMessage = await globalChatService.postMessage(authToken, content, parentId);
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        next(error);
    }
};

const toggleMessageReaction = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const authToken = extractAuthToken(req);
        const updatedReactions = await globalChatService.toggleReaction(authToken, messageId, emoji);
        res.status(200).json({ success: true, data: updatedReactions });
    } catch (error) {
        next(error);
    }
};
const getSingleChatMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const message = await globalChatService.fetchSingleMessage(parseInt(messageId, 10));
        res.status(200).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};
export const globalChatController = {
    getChatMessages,
    postChatMessage,
    toggleMessageReaction,
    getSingleChatMessage,
};