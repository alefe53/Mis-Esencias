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

const props = defineProps<{
  publication: TrackPublication | null;
  isLocal?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

// ❗️ CORRECCIÓN: Esta es la forma segura de determinar si el video está activo.
// Usamos encadenamiento opcional (`?.`) en toda la cadena para evitar errores.
const isVideoEnabled = computed(() => {
  const enabled = !!props.publication?.track && !props.publication?.isMuted;
  // 🪵 LOG: Chequeando estado del video
  // console.log(`[ParticipantView] isVideoEnabled computed: ${enabled}`, { pub: props.publication });
  return enabled;
});

const attachTrack = (track: Track) => {
  // 🪵 LOG: Intentando adjuntar un track.
  console.log(`[ParticipantView] -> Attaching track: ${track.sid}`, track);
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.attach(el);
    console.log(`[ParticipantView] -> ✅ Track ${track.sid} attached to element.`, el);
  } else {
    console.warn(`[ParticipantView] -> ⚠️ Could not attach track ${track.sid}, element not found.`);
  }
};

const detachTrack = (track: Track | undefined) => {
  if (!track) return;
  // 🪵 LOG: Intentando desadjuntar un track.
  console.log(`[ParticipantView] -> Detaching track: ${track.sid}`, track);
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.detach(el);
  }
};

watch(
  () => props.publication,
  (pub) => {
    // 🪵 LOG: La prop 'publication' ha cambiado.
    console.log('[ParticipantView] 👂 Publication prop changed:', pub);
  }
);

watch(
  () => props.publication?.track,
  (newTrack, oldTrack) => {
    // 🪵 LOG: El track dentro de la publicación ha cambiado.
    console.log('[ParticipantView] 👂 Track watcher fired.', { newTrack, oldTrack });
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
  // 🪵 LOG: Componente ParticipantView desmontado.
  console.log('[ParticipantView] 🧹 Component unmounted. Detaching track if exists.');
  detachTrack(props.publication?.track);
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
.no-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111827;
}
audio {
  display: none;
}
</style>