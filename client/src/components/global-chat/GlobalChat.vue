<template>
  <div class="global-chat-container">
    <div class="chat-header">
      <h3>Chat Global</h3>
    </div>
    <div class="chat-body" ref="chatBodyRef" @scroll="handleScroll">
      <div v-if="isLoading" class="loader">Cargando historial...</div>
      <div v-if="pinnedMessages.length > 0" class="pinned-section">
        <ChatMessage
          v-for="message in pinnedMessages"
          :key="message.message_id"
          :message="message"
        />
      </div>
      <ChatMessage
        v-for="message in regularMessages"
        :key="message.message_id"
        :message="message"
      />
    </div>
    <div class="chat-footer"><ChatInput @send="handleSend" /></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalChatStore } from '../../stores/globalChatStore'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useGlobalChatStore()
const { regularMessages, pinnedMessages, isLoading } = storeToRefs(chatStore)
const chatBodyRef = ref<HTMLElement | null>(null)
const userHasScrolledUp = ref(false)

const scrollToBottom = () => {
  nextTick(() => {
    const el = chatBodyRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

const handleScroll = () => {
  const el = chatBodyRef.value
  if (!el) return
  const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50
  userHasScrolledUp.value = !isAtBottom
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
  regularMessages,
  () => {
    if (!userHasScrolledUp.value) {
      scrollToBottom()
    }
  },
  { deep: true },
)

const handleSend = (payload: { content: string; parentId: number | null }) => {
  chatStore.sendMessage(payload.content, payload.parentId)
  userHasScrolledUp.value = false
}
</script>

<style scoped>
.global-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #262c35;
  border-radius: 12px;
  border: 1px solid #39424e;
  overflow: hidden;
}
.chat-header {
  padding: 0.75rem 1rem;
  background-color: #1a1a1a;
  flex-shrink: 0;
  border-bottom: 1px solid #39424e;
  z-index: 2;
}
.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
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
.pinned-section {
  border-bottom: 1px dashed #555;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
