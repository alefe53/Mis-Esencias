<template>
  <div :class="['camera-overlay', streamState.cameraOverlay.position, streamState.cameraOverlay.size]">
    <ParticipantViewV2 :publication="publication" :is-local="true" />
  </div>
</template>

<script setup lang="ts">
import type { TrackPublication } from 'livekit-client';
import { storeToRefs } from 'pinia';
import { useStreamingStoreV2 } from '../../stores/streamingStoreV2';
import ParticipantViewV2 from './ParticipantViewV2.vue';

defineProps<{
  publication: TrackPublication | null;
}>();

// ❗️ NUEVO: El componente ahora accede a la store para ser reactivo
const streamingStore = useStreamingStoreV2();
const { streamState } = storeToRefs(streamingStore);
</script>

<style scoped>
.camera-overlay {
  position: absolute;
  /* Eliminamos la posición y tamaño fijos de aquí */
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
  transition: all 0.4s ease-in-out; /* Una transición más suave */
}

/* --- ❗️ NUEVO: Clases para la POSICIÓN --- */
.bottom-left {
  bottom: 1.5rem;
  left: 1.5rem;
}
.top-left {
  top: 1.5rem;
  left: 1.5rem;
}
.bottom-right {
  bottom: 1.5rem;
  right: 1.5rem;
}
.top-right {
  top: 1.5rem;
  right: 1.5rem;
}

/* --- ❗️ NUEVO: Clases para el TAMAÑO --- */
.sm { /* Pequeña */
  width: 15%;
  min-width: 140px;
}
.md { /* Mediana (el tamaño que tenías) */
  width: 20%;
  min-width: 160px;
}
.lg { /* Grande */
  width: 25%;
  min-width: 180px;
}

.camera-overlay :deep(video) {
  object-fit: cover;
  transform: scaleX(-1);
}
</style>