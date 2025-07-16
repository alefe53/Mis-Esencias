import { defineStore } from 'pinia';
import { ref, nextTick } from 'vue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AdminConversationSummary, ChatMessage } from '../types';
import * as adminService from '../services/adminService';
import { supabase } from '../services/supabaseClient';
import { useUiStore } from './uiStore';

export const useAdminChatStore = defineStore('adminChat', () => {
  const conversations = ref<AdminConversationSummary[]>([]);
  const currentMessages = ref<ChatMessage[]>([]);
  const selectedConversation = ref<AdminConversationSummary | null>(null);

  const isLoading = ref(false);
  const isReplying = ref(false);
  
  let realtimeChannel: RealtimeChannel | null = null;

  async function fetchDashboard() {
    isLoading.value = true;
    try {
      conversations.value = await adminService.getAdminChatDashboard();
    } catch (error) {
      console.error("Error al cargar el dashboard:", error);
      useUiStore().showToast({ message: "No se pudo cargar el dashboard." });
    } finally {
      isLoading.value = false;
    }
  }

  async function selectConversation(convo: AdminConversationSummary) {
    selectedConversation.value = convo;
    currentMessages.value = []; // Limpiar mensajes anteriores
    try {
      currentMessages.value = await adminService.getConversationDetailsAsAdmin(convo.conversation_id);
    } catch (error) {
      console.error("Error al cargar los mensajes:", error);
    }
  }

  async function handleReply(content: string) {
    if (!selectedConversation.value || !content.trim()) return;
    isReplying.value = true;
    try {
      const payload = {
        conversationId: selectedConversation.value.conversation_id,
        userIdToUnblock: selectedConversation.value.user_id,
        content,
      };
      // La respuesta del admin no se añade por real-time, la añadimos manualmente
      const newAdminMessage = await adminService.replyToConversation(payload);
      currentMessages.value.push({ ...newAdminMessage, is_admin: true });

      // Actualización optimista de la lista de la izquierda
      const convoInList = conversations.value.find(c => c.conversation_id === payload.conversationId);
      if (convoInList) {
        convoInList.is_user_blocked = false;
        convoInList.last_message_content = content;
        convoInList.last_message_at = new Date().toISOString();
        // Mover al principio de la lista
        conversations.value = [convoInList, ...conversations.value.filter(c => c.conversation_id !== payload.conversationId)];
      }

    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
    } finally {
      isReplying.value = false;
    }
  }

  function setupRealtimeListeners() {
    if (realtimeChannel) return; // Evitar duplicados

    realtimeChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages' 
        }, 
        (payload) => {
          console.log('Nuevo mensaje recibido en el dashboard admin!', payload);
          const newMessage = payload.new as ChatMessage;

          // Actualizar el panel de la derecha si es la conversación activa
          if (newMessage.id === selectedConversation.value?.conversation_id) {
            currentMessages.value.push(newMessage);
          }

          // Actualizar la lista de la izquierda
          const convoInList = conversations.value.find(c => c.conversation_id === newMessage.id);
          if (convoInList) {
            convoInList.last_message_content = newMessage.content;
            convoInList.last_message_at = newMessage.created_at;
            // Mover al principio de la lista
            conversations.value = [convoInList, ...conversations.value.filter(c => c.conversation_id !== newMessage.id)];
          } else {
            // Es una conversación completamente nueva, recargamos el dashboard
            fetchDashboard();
          }
        }
      )
      .subscribe();
  }

  function cleanupRealtimeListeners() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  return {
    conversations,
    currentMessages,
    selectedConversation,
    isLoading,
    isReplying,
    fetchDashboard,
    selectConversation,
    handleReply,
    setupRealtimeListeners,
    cleanupRealtimeListeners,
  };
});