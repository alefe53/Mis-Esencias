<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isLocal"></video>
    <audio ref="audioEl" autoplay :muted="isLocal"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { type TrackPublication, type LocalTrack, type RemoteTrack } from 'livekit-client';

const props = defineProps<{
  // Ahora recibe una publicación, no un participante entero.
  videoPublication: TrackPublication | null;
  audioPublication: TrackPublication | null;
  isLocal?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

// Observamos directamente la propiedad `track` de la publicación de video.
// Esta es la forma más declarativa y robusta.
watch(() => props.videoPublication?.track, (newTrack, oldTrack) => {
  if (oldTrack && videoEl.value) {
    // Afirmamos el tipo para asegurar que tiene el método .detach()
    const detachableTrack = oldTrack as LocalTrack | RemoteTrack;
    detachableTrack.detach(videoEl.value);
  }
  if (newTrack && videoEl.value) {
    const attachableTrack = newTrack as LocalTrack | RemoteTrack;
    attachableTrack.attach(videoEl.value);
  }
}, { immediate: true });

// Hacemos lo mismo para el audio.
watch(() => props.audioPublication?.track, (newTrack, oldTrack) => {
  if (oldTrack && audioEl.value) {
    const detachableTrack = oldTrack as LocalTrack | RemoteTrack;
    detachableTrack.detach(audioEl.value);
  }
  if (newTrack && audioEl.value) {
    const attachableTrack = newTrack as LocalTrack | RemoteTrack;
    attachableTrack.attach(audioEl.value);
  }
}, { immediate: true });

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
</style>