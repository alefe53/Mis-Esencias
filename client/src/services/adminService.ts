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
export const createPost = async (postData: any): Promise<any> => {
  const { data } = await api.post('/admin/posts', postData);
  return data;
};
export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get('/admin/users');
  return data.data;
};


/**
 * Borra un mensaje del chat global. Requiere rol de admin.
 * @param messageId - El ID del mensaje a borrar.
 */
export const deleteGlobalMessage = async (messageId: number): Promise<void> => {
  await api.delete(`/admin/global-chat/${messageId}`);
};

/**
 * Fija o desfija un mensaje en el chat global. Requiere rol de admin.
 * @param messageId - El ID del mensaje a afectar.
 * @param unpin - Poner en `true` para desfijar, `false` o no enviarlo para fijar.
 */
export const pinGlobalMessage = async (messageId: number, unpin: boolean): Promise<void> => {
  await api.post(`/admin/global-chat/${messageId}/pin`, { unpin });
};

/**
 * Silencia o le quita el silencio a un usuario en el chat global.
 * @param userId - El ID del usuario a afectar.
 * @param isMuted - `true` para silenciar, `false` para quitar el silencio.
 */
export const toggleUserMute = async (userId: string, isMuted: boolean): Promise<void> => {
  await api.post(`/admin/users/${userId}/mute`, { isMuted });
};