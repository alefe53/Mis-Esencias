<template>
  <div class="chat-input-container">
    <div v-if="replyingToMessage" class="replying-to-banner">
      <span
        >Respondiendo a
        <strong>{{ replyingToMessage.author.fullName }}</strong></span
      >
      <button @click="cancelReply" class="cancel-reply-btn">x</button>
    </div>
    <div class="chat-input-wrapper">
      <textarea
        v-model="content"
        @keydown.enter.prevent="handleSubmit"
        placeholder="Escribe un mensaje..."
        rows="2"
        maxlength="280"
        class="chat-textarea"
        ref="textareaRef"
      ></textarea>
      <button
        @click="handleSubmit"
        :disabled="!content.trim()"
        class="send-button"
      >
        Enviar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalChatStore } from '../../stores/globalChatStore'

const emit = defineEmits<{
  (e: 'send', payload: { content: string; parentId: number | null }): void
}>()

const chatStore = useGlobalChatStore()
const { replyingToMessage } = storeToRefs(chatStore)

const content = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const handleSubmit = () => {
  if (content.value.trim()) {
    emit('send', {
      content: content.value,
      parentId: replyingToMessage.value?.message_id || null,
    })
    content.value = ''
    chatStore.cancelReply()
  }
}

const cancelReply = () => {
  chatStore.cancelReply()
}

watch(replyingToMessage, (newMessage) => {
  if (newMessage) {
    nextTick(() => textareaRef.value?.focus())
  }
})
</script>

<style scoped>
.replying-to-banner {
  background-color: #3a414b;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cancel-reply-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.2rem;
  cursor: pointer;
}
.chat-input-wrapper {
  display: flex;
  gap: 0.5rem;
}
.chat-textarea {
  flex-grow: 1;
  background-color: #3a414b;
  border: 1px solid #555;
  border-radius: 8px;
  color: white;
  padding: 0.5rem;
  resize: none;
}
.send-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1.5rem;
  cursor: pointer;
  font-weight: 600;
}
.send-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
</style>
