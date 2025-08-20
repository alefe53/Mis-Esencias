<template>
  <div class="global-chat-container">
    <div class="chat-header">
      <h3>Chat Global</h3>
      <div class="header-controls">
        <button
          @click="openChatPopup"
          class="popup-button"
          title="Abrir en una ventana nueva"
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
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            ></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <div class="autoscroll-toggle">
          <input type="checkbox" id="autoscroll" v-model="autoScrollEnabled" />
          <label for="autoscroll">Auto-Scroll</label>
        </div>
      </div>
    </div>
    <div class="chat-body" ref="chatBodyRef" @scroll="handleScroll">
      <div v-if="isLoading && messages.length === 0" class="loader">
        Cargando historial...
      </div>
      <div v-if="hasMoreHistory && !isLoading" class="loader-top">
        <button @click="loadMoreManually">Cargar más</button>
      </div>
      <ChatMessage
        v-for="message in allSortedMessages"
        :key="message.message_id"
        :message="message"
        :class="{ 'vip-message': message.author.subscriptionTier === 3 }"
      />
    </div>
    <div class="chat-footer">
      <ChatInput @send="handleSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalChatStore } from '../../stores/globalChatStore'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useGlobalChatStore()
const { allSortedMessages, isLoading, messages, hasMoreHistory } =
  storeToRefs(chatStore)
const chatBodyRef = ref<HTMLElement | null>(null)
const autoScrollEnabled = ref(true)

const openChatPopup = () => {
  const width = 400
  const height = 700
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2
  window.open(
    '/chat-popup',
    'chat-popup',
    `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no`,
  )
}

const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
  nextTick(() => {
    const el = chatBodyRef.value
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior })
    }
  })
}

const loadMoreManually = async () => {
  const el = chatBodyRef.value
  if (!el) return
  const oldScrollHeight = el.scrollHeight
  await chatStore.fetchOlderMessages()
  nextTick(() => {
    el.scrollTop = el.scrollHeight - oldScrollHeight
  })
}

const handleScroll = () => {
  const el = chatBodyRef.value
  if (!el) return
  if (el.scrollTop === 0 && !isLoading.value && hasMoreHistory.value) {
    loadMoreManually()
  }
  const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1
  if (isAtBottom) {
    if (!autoScrollEnabled.value) {
      autoScrollEnabled.value = true
    }
  } else {
    if (autoScrollEnabled.value) {
      autoScrollEnabled.value = false
    }
  }
}

onMounted(() => {
  chatStore.connect().then(() => {
    scrollToBottom()
  })
})
onUnmounted(() => {
  chatStore.disconnect()
})

watch(
  () => messages.value.length,
  (newLength, oldLength) => {
    if (
      newLength > oldLength &&
      newLength - oldLength === 1 &&
      autoScrollEnabled.value
    ) {
      scrollToBottom('smooth')
    }
  },
)

const handleSend = (payload: {
  content: string
  parentId: number | null
  wantsToPin: boolean
}) => {
  chatStore.sendMessage(payload.content, payload.parentId, payload.wantsToPin)
  autoScrollEnabled.value = true
}
</script>

<style scoped>
.global-chat-container {
  display: flex;
  flex-direction: column;
  background-color: #262c35;
  border-radius: 12px;
  border: 1px solid #39424e;
  overflow: hidden;
  height: 100%;
}
.chat-header {
  padding: 0.4rem 1rem;
  background-color: #1a1a1a;
  flex-shrink: 0;
  border-bottom: 1px solid #39424e;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-header h3 {
  margin: 0;
  font-size: 1rem;
}
.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.autoscroll-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #9ca3af;
}
.autoscroll-toggle label {
  cursor: pointer;
}
.popup-button {
  background: none;
  border: none;
  color: #9ca3af;
  padding: 0.25rem;
  line-height: 1;
}
.popup-button:hover {
  color: #ffffff;
}
.chat-body {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.chat-footer {
  flex-shrink: 0;
  padding: 0.75rem;
  border-top: 1px solid #39424e;
  background-color: #20252c;
  z-index: 2;
}
.loader {
  text-align: center;
  color: #999;
  margin: auto;
}
.loader-top {
  text-align: center;
  padding: 0.5rem;
}
.loader-top button {
  background: none;
  border: 1px solid #555;
  color: #ccc;
  border-radius: 8px;
  padding: 0.25rem 0.75rem;
}
.chat-body :deep(.vip-message) {
  background-color: rgba(135, 206, 235, 0.1);
  border: 1px solid rgba(135, 206, 235, 0.2);
}
</style>

<style>
@media (prefers-color-scheme: dark) {
  .global-chat-container .message-body p {
    color: #e8e6f4 !important;
  }
  .global-chat-container .author-name {
    color: #e5e2fc !important;
  }
  .global-chat-container .chat-textarea::placeholder {
    color: #9ca3af;
  }
  .global-chat-container .chat-textarea {
    color: #ffffff !important;
  }
}
</style>
