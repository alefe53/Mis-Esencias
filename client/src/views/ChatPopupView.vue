<template>
  <div class="popup-container">
    <GlobalChat />
  </div>
</template>

<script setup lang="ts">
import GlobalChat from '../components/global-chat/GlobalChat.vue'
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Chat Global - Mis Esencias'
})
</script>

<style scoped>
@import '../style.css';

.popup-container {
  width: 100vw;
  height: 100vh;
  padding: 0.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: #1f2937; 
}

.popup-container > :deep(.global-chat-container) {
  flex-grow: 1;
  height: 100%;
}
</style>
