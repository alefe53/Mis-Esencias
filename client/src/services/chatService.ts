// RUTA: src/services/chatService.ts

import api from './api'; // Tu cliente de axios autenticado

export const getMyConversation = async () => {
  const { data } = await api.get('/chat/my-conversation');
  return data.data; // Devuelve { conversationId, isBlocked, messages }
};

export const sendMessageToAdmin = async (content: string) => {
  const { data } = await api.post('/chat/send-to-admin', { content });
  return data.data; // Devuelve el mensaje recién creado
};