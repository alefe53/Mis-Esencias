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
        @keydown.enter.exact.prevent="handleSubmit"
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
    <div class="input-options">
      <div v-if="authStore.isAdmin" class="admin-pin-option">
        <input type="checkbox" id="adminPin" v-model="wantsToPin" />
        <label for="adminPin">Fijar mensaje permanentemente</label>
      </div>
      <div v-else-if="authStore.user?.subscription_tier_id === 3">
        <button
          class="vip-pin-button"
          @click="handleVipPin"
          :disabled="isVipPinOnCooldown"
        >
          <span v-if="!isVipPinOnCooldown">⭐ Destacar mensaje (30s)</span>
          <span v-else>Enfriando... ({{ vipPinCooldownSeconds }}s)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalChatStore } from '../../stores/globalChatStore'
import { useAuthStore } from '../../stores/authStore'

const emit = defineEmits<{
  (
    e: 'send',
    payload: { content: string; parentId: number | null; wantsToPin: boolean },
  ): void
}>()

const chatStore = useGlobalChatStore()
const authStore = useAuthStore()

const { replyingToMessage, isVipPinOnCooldown, vipPinCooldownSeconds } =
  storeToRefs(chatStore)

const content = ref('')
const wantsToPin = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const handleSubmit = () => {
  if (content.value.trim()) {
    emit('send', {
      content: content.value,
      parentId: replyingToMessage.value?.message_id || null,
      wantsToPin: wantsToPin.value,
    })
    content.value = ''
    wantsToPin.value = false
    chatStore.cancelReply()
  }
}

const handleVipPin = () => {
  if (content.value.trim()) {
    emit('send', {
      content: content.value,
      parentId: replyingToMessage.value?.message_id || null,
      wantsToPin: true,
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
/* Estilos existentes */
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
  font-weight: 600;
}
.send-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}

/* Nuevos estilos */
.input-options {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
}
.admin-pin-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
}
.admin-pin-option label {
  cursor: pointer;
}
.vip-pin-button {
  background-color: #ca8a04;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.3rem 0.8rem;
  font-weight: 500;
  font-size: 0.8rem;
}
.vip-pin-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
</style>
