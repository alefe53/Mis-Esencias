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
import { ref, watch, onUnmounted, computed } from 'vue';
import { type TrackPublication } from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null;
  // CAMBIO: La prop ahora se llama 'isMuted' para mayor claridad
  isMuted?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

const isVideoEnabled = computed(() => {
  return !!props.publication?.track && !props.publication?.isMuted;
});

// El resto del script se mantiene exactamente igual
watch(() => props.publication?.track, (_newTrack, oldTrack) => {
  if (oldTrack) {
    oldTrack.detach();
  }
});

watch(
  [() => props.publication, videoEl, audioEl],
  ([pub, vEl, aEl]) => {
    if (pub && pub.track) {
      if (pub.track.kind === 'video' && vEl) {
        pub.track.attach(vEl);
      } else if (pub.track.kind === 'audio' && aEl) {
        pub.track.attach(aEl);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (props.publication?.track) {
    props.publication.track.detach();
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