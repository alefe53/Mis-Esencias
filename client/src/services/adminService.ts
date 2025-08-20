import api from './api';
import type { AdminConversationSummary, ChatMessage, AdminUser, Post, PostComment } from '../types';

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

// --- FUNCIONES AÑADIDAS ---
export const deletePostById = async (postId: number): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};

export const deleteCommentById = async (commentId: number): Promise<void> => {
  await api.delete(`/posts/comments/${commentId}`);
};
// --- FIN DE FUNCIONES AÑADIDAS ---

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get('/admin/users');
  return data.data;
};

export const deleteGlobalMessage = async (messageId: number): Promise<void> => {
  await api.delete(`/admin/global-chat/${messageId}`);
};

export const pinGlobalMessage = async (messageId: number, unpin: boolean): Promise<void> => {
  await api.post(`/admin/global-chat/${messageId}/pin`, { unpin });
};

export const toggleUserMute = async (userId: string, isMuted: boolean): Promise<void> => {
  await api.post(`/admin/users/${userId}/mute`, { isMuted });
};

export const updatePost = async (postId: number, payload: { title: string; content: string }): Promise<Post> => {
    const { data } = await api.put(`/admin/posts/${postId}`, payload);
    return data.data;
};

export const updateComment = async (commentId: number, payload: { content: string }): Promise<PostComment> => {
    const { data } = await api.put(`/admin/comments/${commentId}`, payload);
    return data.data;
};