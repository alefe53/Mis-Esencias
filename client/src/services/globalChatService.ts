// RUTA: src/services/globalChatService.ts

import api from './api';
import type { GlobalChatMessage } from '../stores/globalChatStore';

export interface MessageReaction {
  emoji: string;
  count: number;
  // Quizás también una lista de usuarios que reaccionaron
  // users: { id: number; username: string; }[];
}

// Obtiene el historial inicial de mensajes
export const fetchHistory = async (limit = 50, cursor?: string): Promise<GlobalChatMessage[]> => {
  const params = { limit, cursor };
  const response = await api.get('/global-chat', { params });
  return response.data.data;
};

// Envía un nuevo mensaje o una respuesta
export const postMessage = async (content: string, parentId: number | null): Promise<GlobalChatMessage> => {
  const response = await api.post('/global-chat', { content, parentId });
  return response.data.data;
};

// Añade o quita una reacción a un mensaje
export const toggleReaction = async (messageId: number, emoji: string) => {
  const response = await api.post(`/global-chat/${messageId}/react`, { emoji });
  return response.data.data; 
};

export const getReactions = async (messageId: number): Promise<MessageReaction[]> => {
  const response = await api.get(`/global-chat/${messageId}/reactions`);
  return response.data.data;
};
export const fetchSingleMessage = async (messageId: number): Promise<GlobalChatMessage> => {
    const response = await api.get(`/global-chat/${messageId}`);
    return response.data.data;
};