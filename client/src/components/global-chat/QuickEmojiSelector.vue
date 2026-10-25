<template>
  <div class="quick-emoji-selector" v-click-outside="close">
    <button
      v-for="emoji in commonEmojis"
      :key="emoji"
      @click.stop="selectEmoji(emoji)"
      class="emoji-btn"
    >
      {{ emoji }}
    </button>
    <button @click.stop="openFullPicker" class="emoji-btn more-btn">•••</button>
  </div>
</template>

<script setup lang="ts">
import { vClickOutside } from '../../directives/clickOutside'

const emit = defineEmits<{
  (e: 'select', emoji: string): void
  (e: 'open-full-picker'): void
  (e: 'close'): void
}>()

const commonEmojis = ['👍', '❤️', '😂', '😯', '😢', '🙏']

const selectEmoji = (emoji: string) => {
  emit('select', emoji)
}

const openFullPicker = () => {
  emit('open-full-picker')
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.quick-emoji-selector {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background-color: #374151;
  padding: 0.25rem;
  border-radius: 2rem;
  display: flex;
  gap: 0.15rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 101;
  border: 1px solid #4b5563;
}
.emoji-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  padding: 0.3rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  line-height: 1;
}
.emoji-btn:hover {
  background-color: #4b5563;
}
.more-btn {
  font-size: 1rem;
  color: #d1d5db;
}
</style>
