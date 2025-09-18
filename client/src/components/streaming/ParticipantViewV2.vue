<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isLocal"></video>
    <audio ref="audioEl" autoplay :muted="isLocal && publication?.kind !== 'audio'"></audio>
    <div v-if="!isVideoEnabled" class="no-video-placeholder">
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { type TrackPublication, Track } from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null;
  isLocal?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const isVideoEnabled = ref(false);

const attach = (track: Track) => {
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.attach(el);
    if (track.kind === 'video') isVideoEnabled.value = true;
  }
};

const detach = (track: Track) => {
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (el) {
    track.detach(el);
    if (track.kind === 'video') isVideoEnabled.value = false;
  }
};

// Observamos directamente el track dentro de la publicación.
// Esto es más simple y reacciona a los eventos de suscripción/desuscripción.
watch(
  () => props.publication?.track,
  (newTrack, oldTrack) => {
    if (oldTrack) {
      detach(oldTrack);
    }
    if (newTrack) {
      attach(newTrack);
    } else {
      isVideoEnabled.value = false;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (props.publication?.track) {
    detach(props.publication.track);
  }
});
</script>

<style scoped>
.participant-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #000;
}
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.participant-view:has(video[muted]) video {
    transform: scaleX(-1);
}
.no-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111827;
  color: #d1d5db;
  font-size: 1.5rem;
}
</style>