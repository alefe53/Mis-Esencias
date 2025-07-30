// adminChatStore.ts
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
    currentMessages.value = []; 
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
      const newAdminMessage = await adminService.replyToConversation(payload);
      currentMessages.value.push({ ...newAdminMessage, is_admin: true });

      const convoInList = conversations.value.find(c => c.conversation_id === payload.conversationId);
      if (convoInList) {
        convoInList.is_user_blocked = false;
        convoInList.last_message_content = content;
        convoInList.last_message_at = new Date().toISOString();
        conversations.value = [convoInList, ...conversations.value.filter(c => c.conversation_id !== payload.conversationId)];
      }

    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
    } finally {
      isReplying.value = false;
    }
  }

  function setupRealtimeListeners() {
    if (realtimeChannel) return; 

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

          if (newMessage.id === selectedConversation.value?.conversation_id) {
            currentMessages.value.push(newMessage);
          }

          const convoInList = conversations.value.find(c => c.conversation_id === newMessage.id);
          if (convoInList) {
            convoInList.last_message_content = newMessage.content;
            convoInList.last_message_at = newMessage.created_at;
            conversations.value = [convoInList, ...conversations.value.filter(c => c.conversation_id !== newMessage.id)];
          } else {
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

  async function deleteConversation(conversationId: number) {
    const confirmation = window.confirm("¿Estás seguro de que quieres borrar esta conversación PERMANENTEMENTE?");
    if (!confirmation) return;

    try {
      await adminService.deleteConversationById(conversationId);
      conversations.value = conversations.value.filter(c => c.conversation_id !== conversationId);
      if (selectedConversation.value?.conversation_id === conversationId) {
        selectedConversation.value = null;
        currentMessages.value = [];
      }
      useUiStore().showToast({ message: "Conversación borrada.", color: '#4ade80' });
    } catch (error) {
      console.error("Error al borrar la conversación:", error);
      useUiStore().showToast({ message: "No se pudo borrar la conversación." });
    }
  }

  async function deleteMessage(messageId: number) {
    const confirmation = window.confirm("¿Estás seguro de que quieres borrar este mensaje?");
    if (!confirmation) return;

    try {
      await adminService.deleteMessageById(messageId);
      currentMessages.value = currentMessages.value.filter(m => m.id !== messageId);
    } catch (error) {
      console.error("Error al borrar el mensaje:", error);
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
    deleteConversation,
    deleteMessage,
  };
});