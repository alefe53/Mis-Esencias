<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <div class="conversations-panel">
        <div v-if="isLoading" class="loader">Cargando...</div>
        <div
          v-for="convo in conversations"
          :key="convo.conversation_id"
          class="chat-item"
          :class="{
            blocked: convo.is_user_blocked,
            active:
              selectedConversation?.conversation_id === convo.conversation_id,
          }"
          @click="store.selectConversation(convo)"
        >
          <div class="user-info">
            <span class="user-name">{{ convo.user_full_name }}</span>
            <p class="last-message">{{ convo.last_message_content }}</p>
          </div>
          <div class="meta-info">
            <span class="timestamp">{{ convo.last_message_formatted }}</span>
            <div class="meta-actions">
              <span v-if="convo.is_user_blocked" class="blocked-badge"
                >Bloqueado</span
              >
              <button
                @click.stop="store.deleteConversation(convo.conversation_id)"
                class="delete-btn convo-delete-btn"
                title="Borrar conversación"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  ></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="messages-panel">
        <div v-if="!selectedConversation" class="empty-state">
          Selecciona una conversación para ver los mensajes.
        </div>
        <div v-else>
          <div class="messages-area" ref="messagesContainerRef">
            <div
              v-for="msg in currentMessages"
              :key="msg.id"
              class="message-wrapper"
              :class="{
                'admin-message': msg.is_admin,
                'user-message': !msg.is_admin,
              }"
            >
              <div class="message-bubble">
                <p>{{ msg.content }}</p>
                <button
                  @click="store.deleteMessage(msg.id)"
                  class="delete-btn msg-delete-btn"
                  title="Borrar mensaje"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div class="reply-area">
            <textarea
              v-model="replyContent"
              placeholder="Escribe tu respuesta..."
            ></textarea>
            <button
              @click="onReply"
              :disabled="!replyContent.trim() || isReplying"
            >
              {{ isReplying ? 'Enviando...' : 'Responder y Desbloquear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminChatStore } from '../stores/adminChatStore'

const store = useAdminChatStore()

const {
  conversations,
  currentMessages,
  selectedConversation,
  isLoading,
  isReplying,
} = storeToRefs(store)

const replyContent = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  store.fetchDashboard()
  store.setupRealtimeListeners()
})

onUnmounted(() => {
  store.cleanupRealtimeListeners()
})

const onReply = () => {
  store.handleReply(replyContent.value)
  replyContent.value = ''
}

watch(
  currentMessages,
  async () => {
    await nextTick()
    const container = messagesContainerRef.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  },
  { deep: true },
)
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
}
.dashboard-layout {
  display: flex;
  gap: 1rem;
  height: 75vh;
  background-color: rgba(0, 0, 0, 0.2);
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
  position: relative;
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
  padding-right: 20px;
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
.meta-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.blocked-badge {
  background-color: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
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
.delete-btn {
  background: none;
  border: none;
  color: #6b7280;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition:
    color 0.2s,
    background-color 0.2s;
}
.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}
.convo-delete-btn {
  padding: 4px;
}
.msg-delete-btn {
  position: absolute;
  top: 2px;
  right: 5px;
  opacity: 0;
}
.message-bubble:hover .msg-delete-btn {
  opacity: 1;
}
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
    height: calc(100vh - 100px);
    padding: 0.5rem;
  }

  .conversations-panel {
    width: 100%;
    flex-shrink: 1;
    border-right: none;
    border-bottom: 2px solid #444;
    padding-right: 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .messages-panel {
    height: 100%;
  }

  .message-wrapper {
    max-width: 90%;
  }

  .chat-item {
    padding: 0.75rem;
  }
}
</style>
