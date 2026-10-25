<template>
  <transition name="modal-fade">
    <div class="embed-backdrop" @click="$emit('close')">
      <div class="embed-content" @click.stop :style="contentStyle">
        <button class="embed-close-button" @click="$emit('close')">×</button>
        <iframe
          v-if="embedData.src"
          :src="embedData.src"
          width="100%"
          height="100%"
          style="border-radius: 12px; border: 0"
          allowfullscreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
        <div v-else class="error-message">
          No se puede embeber este contenido.
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  platform: string
  url: string
}>()

defineEmits(['close'])

const embedData = computed(() => {
  if (!props.url) return { src: '', height: null }

  switch (props.platform.toLowerCase()) {
    case 'spotify': {
      const srcMatch = props.url.match(/src="([^"]+)"/)
      const heightMatch = props.url.match(/height="([^"]+)"/)
      return {
        src: srcMatch ? srcMatch[1] : '',
        height: heightMatch ? heightMatch[1] : '352',
      }
    }
    case 'youtube': {
      return {
        src: `https://www.youtube.com/embed/${props.url}`,
        height: null,
      }
    }
    default:
      return { src: '', height: null }
  }
})

const contentStyle = computed(() => {
  if (embedData.value.height) {
    return {
      height: `${embedData.value.height}px`,
      maxHeight: `${embedData.value.height}px`,
    }
  }
  return {}
})
</script>

<style scoped>
.embed-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2001;
}

.embed-content {
  position: relative;
  width: 90%;
  max-width: 800px;
  height: auto;
  max-height: 90vh;
  background-color: #181818;
  border-radius: 12px;
  padding: 0;
  display: flex;
  transition: height 0.3s ease;
}

.embed-content:has(iframe[src*='youtube.com']) {
  aspect-ratio: 16 / 9;
  height: auto;
}

.embed-close-button {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  color: black;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-size: 1.2rem;
  padding: 2rem;
}
</style>
