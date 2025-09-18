<template>
  <div class="camera-overlay">
    {{ console.log('[CameraOverlay] Rendering with publication:', publication?.trackSid) }}
    <ParticipantViewV2 :publication="publication" :is-local="true" />
  </div>
</template>

<script setup lang="ts">
import type { TrackPublication } from 'livekit-client';
import ParticipantViewV2 from './ParticipantViewV2.vue';

defineProps<{
  publication: TrackPublication | null;
}>();
</script>

<style scoped>
.camera-overlay {
  position: absolute;
  /* ❗️ Posición abajo a la izquierda como pediste */
  bottom: 1.5rem;
  left: 1.5rem;
  width: 20%;
  max-width: 280px;
  min-width: 160px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
  transition: all 0.3s ease-in-out;
}

.camera-overlay :deep(video) {
  /* La cámara en el overlay debe cubrir su contenedor y tener el efecto espejo */
  object-fit: cover;
  transform: scaleX(-1);
}
</style>