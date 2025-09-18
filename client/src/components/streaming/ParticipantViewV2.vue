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
// Usamos shallowRef para evitar que Vue haga reactivo el objeto del track, que es complejo
const attachedTrack = shallowRef<Track | null>(null);

const isVideoEnabled = computed(() => {
  return props.publication?.track && !props.publication.isMuted;
});

// ✅ UNIFICADO: Un único watcher que reacciona al cambio más importante: la aparición del track.
watch(() => props.publication?.track, (newTrack) => {
  console.log(`[ParticipantViewV2] El track ha cambiado. Nuevo track: ${newTrack?.sid}`);

  // Primero, siempre limpiamos el track anterior si existe.
  if (attachedTrack.value) {
    console.log(`[ParticipantViewV2] -> Desvinculando track anterior: ${attachedTrack.value.sid}`);
    const element = attachedTrack.value.detach();
    element.forEach(el => el.remove());
  }
  
  attachedTrack.value = newTrack ?? null;

  // Si hay un nuevo track y ya tenemos los elementos del DOM, lo vinculamos.
  if (newTrack) {
    if (newTrack.kind === 'video' && videoEl.value) {
      console.log(`[ParticipantViewV2] -> Vinculando nuevo track de VIDEO ${newTrack.sid} al elemento <video>.`);
      newTrack.attach(videoEl.value);
    }
    if (newTrack.kind === 'audio' && audioEl.value) {
      console.log(`[ParticipantViewV2] -> Vinculando nuevo track de AUDIO ${newTrack.sid} al elemento <audio>.`);
      newTrack.attach(audioEl.value);
    }
  }
}, { immediate: true }); // ✅ REACTIVIDAD: Se ejecuta tan pronto como el componente se monta.

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