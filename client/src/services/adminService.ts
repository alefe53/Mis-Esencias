// RUTA: src/services/adminService.ts

import api from './api';
import type { ChatMessage } from '../types';

// Llama al endpoint que creamos para obtener la lista de conversaciones
export const getAdminChatDashboard = async () => {
  const { data } = await api.get('/chat/admin/dashboard');
  return data.data;
};

// Función para que el admin obtenga los mensajes de una conversación específica
export const getConversationDetailsAsAdmin = async (conversationId: number): Promise<ChatMessage[]> => {
  // Necesitaremos crear este endpoint en el backend en el siguiente paso
  const { data } = await api.get(`/chat/admin/conversation/${conversationId}`);
  return data.data.messages;
};

// Función para que el admin envíe una respuesta
export const replyToConversation = async (payload: {
  conversationId: number;
  userIdToUnblock: string;
  content: string;
}) => {
  const { data } = await api.post('/chat/admin/reply', payload);
  return data.data;
};