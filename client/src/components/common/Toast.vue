<template>
  <transition name="toast-fade">
    <div
      v-if="visible"
      class="toast-notification"
      :style="{ backgroundColor: backgroundColor }"
    >
      <p>{{ message }}</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
  backgroundColor: string
}>()
</script>

<style scoped>
.toast-notification {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  font-size: 0.9rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
