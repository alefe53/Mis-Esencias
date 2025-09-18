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

const isVideoEnabled = computed(() => {
  return !!props.publication?.track && !props.publication?.isMuted;
});

// ❗️❗️❗️ INICIO DE LA CORRECCIÓN ❗️❗️❗️
// Esta es la lógica corregida. Separamos el manejo de "attach" y "detach"
// para que sea más claro y robusto.

// Watcher para DESADJUNTAR: Se dispara cuando el track desaparece.
watch(() => props.publication?.track, (_newTrack, oldTrack) => {
  if (oldTrack) {
    // 🪵 LOG: El track anterior ha desaparecido, lo desadjuntamos.
    console.log(`[ParticipantView] -> Detaching old track ${oldTrack.sid} because track prop changed.`);
    oldTrack.detach();
  }
});

// Watcher para ADJUNTAR: Se dispara cuando el track O los elementos de video/audio están listos.
// Esto soluciona la condición de carrera.
watch(
  [() => props.publication?.track, videoEl, audioEl],
  ([track, vEl, aEl], [_oldTrack, _oldVEl, _oldAEl]) => {
    // 🪵 LOG: Watcher de adjuntar se ha disparado.
    console.log(`[ParticipantView] Attach watcher fired for track: ${track?.sid}. Video element ready: ${!!vEl}`);

    if (!track) {
      // Si no hay track, no hay nada que hacer.
      return;
    }

    // Si el track es el mismo pero el elemento acaba de aparecer, lo adjuntamos.
    if (track.kind === 'video') {
      if (vEl) {
        // 🪵 LOG: Elemento de video está listo. Adjuntando...
        console.log(`[ParticipantView] -> ✅ Attaching video track ${track.sid} to element.`);
        track.attach(vEl);
      } else {
        // 🪵 LOG: Aún esperando el elemento de video.
        console.log(`[ParticipantView] -> ⏳ Video element not ready yet for track ${track.sid}.`);
      }
    } else if (track.kind === 'audio') {
      if (aEl) {
        // 🪵 LOG: Elemento de audio está listo. Adjuntando...
        console.log(`[ParticipantView] -> ✅ Attaching audio track ${track.sid} to element.`);
        track.attach(aEl);
      }
    }
  },
  { immediate: true }
);
// ❗️❗️❗️ FIN DE LA CORRECCIÓN ❗️❗️❗️

onUnmounted(() => {
  // 🪵 LOG: Componente se desmonta, limpiando.
  console.log(`[ParticipantView] 🧹 Component unmounted. Detaching track ${props.publication?.trackSid} if it exists.`);
  if (props.publication?.track) {
    props.publication.track.detach();
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