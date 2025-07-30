// chatStore.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ChatMessage } from '../types';
import * as chatService from '../services/chatService';
import { supabase } from '../services/supabaseClient';
import { useUiStore } from './uiStore';
import { useAuthStore } from './authStore';

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([]);
  const isBlocked = ref(false);
  const isLoading = ref(false);
  const isChatOpen = ref(false);
  const conversationId = ref<number | null>(null);
  const isChatActivated = ref(false);

  let realtimeChannel: RealtimeChannel | null = null;

  const uiStore = useUiStore();
  const authStore = useAuthStore();

  function toggleChat(isOpen?: boolean) {
    isChatOpen.value = isOpen ?? !isChatOpen.value;
    
    if (isChatOpen.value && !isChatActivated.value) {
      isChatActivated.value = true;
      localStorage.setItem('chatActivated', 'true');
    }

    if (isChatOpen.value && conversationId.value === null && authStore.isAuthenticated) {
      fetchConversation();
    }
  }

  function checkChatActivationStatus() {
    if (localStorage.getItem('chatActivated') === 'true') {
      isChatActivated.value = true;
    }
  }

  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      cleanupRealtimeSubscription();
      messages.value = [];
      conversationId.value = null;
      isChatOpen.value = false;
      isChatActivated.value = false;
      localStorage.removeItem('chatActivated');
    }
  });

  async function fetchConversation() {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const data = await chatService.getMyConversation();
      messages.value = data.messages;
      isBlocked.value = data.isBlocked;
      conversationId.value = data.conversationId;
      setupRealtimeSubscription();
    } catch (error) {
      console.error("Error al obtener la conversación:", error);
      uiStore.showToast({ message: "No se pudo cargar el chat.", color: '#EF4444' });
    } finally {
      isLoading.value = false;
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isBlocked.value) return;
    try {
      const newSentMessage = await chatService.sendMessageToAdmin(content);
      messages.value.push({
        ...newSentMessage,
        is_admin: false
      });
    } catch (error: any) {
      console.error("Error al enviar el mensaje:", error);
      const errorMessage = error.response?.data?.message || "Error al enviar el mensaje.";
      uiStore.showToast({ message: errorMessage, color: '#EF4444' });
      if (error.response?.status === 403) {
        isBlocked.value = true;
      }
    }
  }

  function setupRealtimeSubscription() {
    if (realtimeChannel) {
      cleanupRealtimeSubscription();
    }
    if (!conversationId.value) return;

    const channel = supabase.channel(`chat:${conversationId.value}`);
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId.value}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        const isAdminMessage = newMessage.sender_id !== authStore.user?.id;
        newMessage.is_admin = isAdminMessage;
        
        messages.value.push(newMessage);
        
        if (isAdminMessage) {
          isBlocked.value = false;
        }
      })
      .subscribe();
      
    realtimeChannel = channel;
  }

  function cleanupRealtimeSubscription() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }
  
  return {
    messages,
    isBlocked,
    isLoading,
    isChatOpen,
    isChatActivated,
    toggleChat,
    fetchConversation,
    sendMessage,
    cleanupRealtimeSubscription,
    checkChatActivationStatus,
  };
});