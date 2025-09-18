<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isMuted"></video>
    <audio ref="audioEl" autoplay :muted="isMuted"></audio>
    
    <div v-if="!isVideoEnabled" class="no-video-placeholder">
      <p v-if="!publication">Sin video</p>
      <p v-else>Cámara desactivada</p>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, watch, onUnmounted, computed, shallowRef } from 'vue';
import type { Track, TrackPublication } from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null;
  isMuted?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const attachedTrack = shallowRef<Track | null>(null);

const isVideoEnabled = computed(() => {
  return props.publication?.track && !props.publication.isMuted;
});

// ❗️ ESTA ES LA CORRECCIÓN DEFINITIVA PARA LA PANTALLA NEGRA ❗️
// Observamos tanto el track como la referencia al elemento de video.
watch(
  [() => props.publication?.track, videoEl], 
  ([newTrack, vEl]) => {
    // Primero, siempre limpiamos el track anterior para evitar fugas.
    if (attachedTrack.value) {
      const detachedElements = attachedTrack.value.detach();
      detachedElements.forEach(el => el.remove());
    }
    
    attachedTrack.value = newTrack ?? null;

    // Solo adjuntamos si TENEMOS AMBOS: el track y el elemento del DOM.
    if (newTrack && vEl && newTrack.kind === 'video') {
      newTrack.attach(vEl);
    }
    
    // Hacemos lo mismo para el audio.
    if (newTrack && audioEl.value && newTrack.kind === 'audio') {
      newTrack.attach(audioEl.value);
    }
  }, 
  { immediate: true, deep: true }
);

onUnmounted(() => {
  if (attachedTrack.value) {
    attachedTrack.value.detach();
  }
});
</script>
<style scoped>
/* Tus estilos se mantienen igual */
.participant-view { width: 100%; height: 100%; position: relative; background-color: #000; overflow: hidden; }
video, audio { width: 100%; height: 100%; object-fit: contain; /* CAMBIO: 'contain' suele ser mejor para streams */ }
.no-video-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: #111827; color: #a0a0a0; }
audio { display: none; }
</style>