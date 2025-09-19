
<template>
  <div :class="['camera-overlay', position, size]">
    <ParticipantViewV2 
      :publication="publication" 
      :is-muted="true"
      :key="publication?.trackSid" 
    />
    </div>
</template>

<script setup lang="ts">
import type { TrackPublication } from 'livekit-client';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';
import ParticipantViewV2 from './ParticipantViewV2.vue';

// Este componente ahora es "tonto": no accede a ningún store.
// Recibe toda la información que necesita para renderizarse a través de props.
defineProps<{
  publication: TrackPublication | null;
  position: OverlayPosition;
  size: OverlaySize;
}>();
</script>

<style scoped>
/* Tus estilos existentes funcionan perfecto aquí */
.camera-overlay {
  position: absolute;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 10;
  transition: all 0.4s ease-in-out;
}
.bottom-left { bottom: 1.5rem; left: 1.5rem; }
.top-left { top: 1.5rem; left: 1.5rem; }
.bottom-right { bottom: 1.5rem; right: 1.5rem; }
.top-right { top: 1.5rem; right: 1.5rem; }
.sm { width: 15%; min-width: 140px; }
.md { width: 20%; min-width: 160px; }
.lg { width: 25%; min-width: 180px; }
.camera-overlay :deep(video) {
  object-fit: cover;
  transform: scaleX(-1);
}
</style>