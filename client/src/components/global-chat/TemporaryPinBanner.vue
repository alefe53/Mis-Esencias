<template>
  <transition name="fade-banner">
    <div v-if="message" class="temporary-pin-banner">
      ⭐ <strong>{{ message.author.fullName }}</strong
      >: {{ message.content }}
    </div>
  </transition>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { GlobalChatMessage } from '../../stores/globalChatStore'
defineProps({
  message: {
    type: Object as PropType<GlobalChatMessage | null>,
    default: null,
  },
})
</script>
<style scoped>
.temporary-pin-banner {
  padding: 0.75rem 1rem;
  background-color: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(135, 206, 235, 0.3);
  color: #87ceeb;
  font-size: 0.9rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
.fade-banner-enter-active,
.fade-banner-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.fade-banner-enter-from,
.fade-banner-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
