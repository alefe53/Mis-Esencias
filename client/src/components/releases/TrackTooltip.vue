<template>
  <div class="track-tooltip" :style="{ backgroundColor: color }">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  color: string
}>()
</script>

<style scoped>
.track-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 6px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.track-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--bg-color) transparent transparent transparent;
}
</style>
