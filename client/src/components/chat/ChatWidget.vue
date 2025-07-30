<template>
  <div class="chat-widget-container">
    <transition name="chat-window-fade">
      <div v-if="isChatOpen" class="chat-window">
        <div class="chat-header">
          <h3>Chat con Ale</h3>
          <button @click="toggleChat(false)" class="close-btn">×</button>
        </div>

        <div class="messages-area" ref="messagesContainerRef">
          <div v-if="isLoading" class="loader">Cargando...</div>
          <div v-else-if="messages.length === 0" class="welcome-message">
            <p>
              No soy un chatbot, puedo tardar en contestar pero siempre
              contesto.
            </p>
          </div>
          <div
            v-else
            v-for="msg in messages"
            :key="msg.id"
            class="message-wrapper"
            :class="{
              'admin-message': msg.is_admin,
              'user-message': !msg.is_admin,
            }"
          >
            <div class="message-bubble">
              <p>{{ msg.content }}</p>
              <span class="timestamp">{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div v-if="isBlocked" class="blocked-overlay">
            <span>Esperando respuesta de Ale...</span>
          </div>
          <textarea
            v-model="newMessage"
            @keydown.enter.prevent="handleSendMessage"
            :disabled="isBlocked"
            placeholder="Escribe tu mensaje..."
            maxlength="400"
            rows="3"
          ></textarea>
          <div class="input-footer">
            <span class="char-counter">{{ newMessage.length }} / 400</span>
            <button
              @click="handleSendMessage"
              :disabled="isBlocked || !newMessage.trim()"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="chat-bubble-fade">
      <button
        v-if="!isChatOpen"
        @click="toggleChat(true)"
        class="chat-bubble"
        :style="bubbleStyle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
        </svg>
        <span>Chatea conmigo</span>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '../../stores/chatStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useUiStore } from '../../stores/uiStore'
import { moodColors } from '../../constants/moods'

const chatStore = useChatStore()
const playerStore = usePlayerStore()
const uiStore = useUiStore()

const { messages, isBlocked, isLoading, isChatOpen } = storeToRefs(chatStore)
const { currentMoodId } = storeToRefs(playerStore)
const { availableMoods } = storeToRefs(uiStore)
const { toggleChat, sendMessage, cleanupRealtimeSubscription } = chatStore

const newMessage = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)

const bubbleStyle = computed(() => {
  if (currentMoodId.value === null) return {}

  const mood = availableMoods.value.find((m) => m.id === currentMoodId.value)
  if (!mood) return {}

  const color = moodColors[mood.name]
  const textColor =
    mood.name === 'Lo que sea' || mood.name === 'Llevándola'
      ? '#111827'
      : '#FFFFFF'

  return {
    backgroundColor: color,
    color: textColor,
  }
})

const handleSendMessage = () => {
  if (newMessage.value.trim()) {
    sendMessage(newMessage.value)
    newMessage.value = ''
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = messagesContainerRef.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

watch(isChatOpen, (isOpen) => {
  if (isOpen) {
    scrollToBottom()
  }
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
})
</script>

<style scoped>
.chat-widget-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1100;
}
.chat-bubble {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.5s ease;
}
.chat-bubble:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
}
.chat-window {
  width: 370px;
  height: 500px;
  background-color: #262626;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #404040;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #1a1a1a;
  color: #f5f5f5;
  flex-shrink: 0;
}
.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
}
.close-btn {
  background: none;
  border: none;
  color: #a3a3a3;
  font-size: 2rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}
.messages-area {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
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
  background-color: #3b82f6;
  border-bottom-right-radius: 4px;
}
.admin-message .message-bubble {
  background-color: #525252;
  border-bottom-left-radius: 4px;
}
.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.timestamp {
  display: block;
  font-size: 0.7rem;
  color: #e0e0e0;
  opacity: 0.8;
  text-align: right;
  margin-top: 4px;
}
.chat-input-area {
  padding: 1rem;
  border-top: 1px solid #404040;
  position: relative;
}
.blocked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(40, 40, 40, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a3a3a3;
  font-style: italic;
  z-index: 5;
}
textarea {
  width: 100%;
  background: #404040;
  border: 1px solid #525252;
  border-radius: 8px;
  color: white;
  padding: 0.5rem;
  resize: none;
  box-sizing: border-box;
}
.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
.char-counter {
  font-size: 0.8rem;
  color: #a3a3a3;
}
.chat-window-fade-enter-active,
.chat-window-fade-leave-active,
.chat-bubble-fade-enter-active,
.chat-bubble-fade-leave-active {
  transition: all 0.3s ease;
}
.chat-window-fade-enter-from,
.chat-window-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.chat-bubble-fade-enter-from,
.chat-bubble-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.welcome-message {
  text-align: center;
  padding: 1rem;
  color: #a3a3a3;
  font-style: italic;
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: auto 1rem;
}
</style>
