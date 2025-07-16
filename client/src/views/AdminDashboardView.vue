<template>
  <div class="dashboard-container">
    <h1>Panel de Chat</h1>
    <div class="dashboard-layout">
      <div class="conversations-panel">
        <div v-if="isLoading" class="loader">Cargando...</div>
        <div
          v-for="convo in conversations"
          :key="convo.conversation_id"
          class="chat-item"
          :class="{ 
            'blocked': convo.is_user_blocked,
            'active': selectedConversation?.conversation_id === convo.conversation_id
          }"
          @click="store.selectConversation(convo)"
        >
          <div class="user-info">
            <span class="user-name">{{ convo.user_full_name }}</span>
            <p class="last-message">{{ convo.last_message_content }}</p>
          </div>
          <div class="meta-info">
            <span class="timestamp">{{ formatTimestamp(convo.last_message_at) }}</span>
            <span v-if="convo.is_user_blocked" class="blocked-badge">Bloqueado</span>
          </div>
        </div>
      </div>

      <div class="messages-panel">
        <div v-if="!selectedConversation" class="empty-state">
          Selecciona una conversación para ver los mensajes.
        </div>
        <div v-else>
          <div class="messages-area" ref="messagesContainerRef">
             <div v-for="msg in currentMessages" :key="msg.id" class="message-wrapper" :class="{ 'admin-message': msg.is_admin, 'user-message': !msg.is_admin }">
               <div class="message-bubble">
                 <p>{{ msg.content }}</p>
               </div>
             </div>
          </div>
          <div class="reply-area">
            <textarea v-model="replyContent" placeholder="Escribe tu respuesta..."></textarea>
            <button @click="onReply" :disabled="!replyContent.trim() || isReplying">
              {{ isReplying ? 'Enviando...' : 'Responder y Desbloquear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useAdminChatStore } from '../stores/adminChatStore';

const store = useAdminChatStore();

const { 
  conversations, 
  currentMessages, 
  selectedConversation, 
  isLoading, 
  isReplying 
} = storeToRefs(store);

const replyContent = ref('');
const messagesContainerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  store.fetchDashboard();
  store.setupRealtimeListeners();
});

onUnmounted(() => {
  store.cleanupRealtimeListeners();
});

const onReply = () => {
  store.handleReply(replyContent.value);
  replyContent.value = '';
};

const formatTimestamp = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } else if (date >= startOfYesterday) {
    return 'Ayer';
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } else {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};

watch(currentMessages, async () => {
  await nextTick();
  const container = messagesContainerRef.value;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}, { deep: true });
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 2rem auto;
  color: #fff;
}
.dashboard-layout {
  display: flex;
  gap: 1rem;
  height: 75vh;
  background-color: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 8px;
}
.conversations-panel {
  width: 350px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: 1rem;
  border-right: 1px solid #444;
}
.messages-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.message-wrapper { 
  display: flex; 
  max-width: 80%; 
}
.user-message { 
  align-self: flex-end; 
}
.admin-message { 
  align-self: flex-start; 
}
.message-bubble { 
  padding: 0.5rem 0.9rem; 
  border-radius: 18px; 
  color: white; 
}
.user-message .message-bubble { 
  background-color: #525252; 
  border-bottom-right-radius: 4px; 
}
.admin-message .message-bubble { 
  background-color: #3b82f6; 
  border-bottom-left-radius: 4px; 
}
.message-bubble p { 
  margin: 0; 
}
.reply-area { 
  padding-top: 1rem; 
  border-top: 1px solid #444; 
}
.reply-area textarea {
  box-sizing: border-box;
  width: 100%;
  height: 80px;
  background-color: #1a1a1a;
  border: 1px solid #444;
  color: #eee;
  padding: 8px;
  border-radius: 4px;
  resize: vertical;
}
.reply-area button {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
}
.reply-area button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
.chat-item {
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05); 
  border-radius: 6px;
  border-left: 4px solid #3b82f6; 
  cursor: pointer; 
  transition: background-color 0.2s;
  margin-bottom: 0.5rem;
}
.chat-item.active { 
  background-color: rgba(59, 130, 246, 0.3); 
}
.chat-item:hover { 
  background-color: rgba(255, 255, 255, 0.1); 
}
.chat-item.blocked { 
  border-left-color: #ef4444; 
}
.user-info {
  overflow: hidden;
}
.user-name { 
  font-weight: bold; 
  font-size: 1.1rem; 
  color: #f5f5f5;
}
.last-message { 
  margin: 0.25rem 0 0; 
  color: #a0a0a0; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.meta-info { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-end; 
  font-size: 0.8rem; 
  color: #a0a0a0;
  flex-shrink: 0;
  margin-left: 0.5rem;
}
.blocked-badge { 
  background-color: #ef4444; 
  color: white; 
  padding: 2px 6px; 
  border-radius: 10px; 
  font-size: 0.7rem; 
  margin-top: 0.5rem; 
  font-weight: bold;
}
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #777;
  font-style: italic;
  font-size: 1.2rem;
}
</style>