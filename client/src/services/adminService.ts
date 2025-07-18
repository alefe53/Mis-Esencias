// src/services/adminService.ts
import api from './api';
import type { AdminConversationSummary, ChatMessage, AdminUser } from '../types';

// --- CHAT ADMIN ---
export const getAdminChatDashboard = async (): Promise<AdminConversationSummary[]> => {
  const { data } = await api.get('/chat/admin/dashboard');
  return data.data;
};

export const getConversationDetailsAsAdmin = async (conversationId: number): Promise<ChatMessage[]> => {
  const { data } = await api.get(`/chat/admin/conversation/${conversationId}`);
  return data.data.messages;
};

export const replyToConversation = async (payload: {
  conversationId: number;
  userIdToUnblock: string;
  content: string;
}): Promise<ChatMessage> => {
  const { data } = await api.post('/chat/admin/reply', payload);
  return data.data;
};

export const deleteConversationById = async (conversationId: number): Promise<void> => {
  await api.delete(`/admin/chats/conversations/${conversationId}`);
};

export const deleteMessageById = async (messageId: number): Promise<void> => {
  await api.delete(`/admin/chats/messages/${messageId}`);
};

// --- USER ADMIN ---
export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get('/admin/users');
  return data.data;
};