<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isLocal"></video>
    <audio ref="audioEl" autoplay :muted="isLocal"></audio>
    
    <div v-if="!isVideoEnabled" class="no-video-placeholder">
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { type TrackPublication, Track } from 'livekit-client';
import type { VideoTrack } from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null;
  isLocal?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

// ❗️ CORRECCIÓN: Esta es la forma correcta de determinar si el video está activo.
// Un video está "enabled" si tenemos una publicación de cámara,
// su track está disponible (estamos suscritos) y NO está muteado.
const isVideoEnabled = computed(() => {
  return (
    props.publication?.source === Track.Source.Camera &&
    !!props.publication.track &&
    !props.publication.isMuted
  );
});

const attachTrack = (track: Track) => {
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.attach(el);
  }
};

const detachTrack = (track: Track) => {
  if (!track) return;
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.detach(el);
  }
};

// Observamos directamente el track DENTRO de la publicación.
// Esto reacciona automáticamente a suscripciones, desuscripciones, y cambios en el track.
watch(
  () => props.publication?.track,
  (newTrack, oldTrack) => {
    if (oldTrack) {
      detachTrack(oldTrack);
    }
    if (newTrack) {
      attachTrack(newTrack);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (props.publication?.track) {
    detachTrack(props.publication.track);
  }
});
</script>

<style scoped>
.participant-view {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  overflow: hidden;
}
video, audio {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* El efecto espejo se aplica desde el componente padre (AdminStreamViewV2) */
/* para que solo aplique al video del administrador. */

.no-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111827;
}

audio {
  display: none; /* El tag de audio no necesita ser visible */
}
</style>