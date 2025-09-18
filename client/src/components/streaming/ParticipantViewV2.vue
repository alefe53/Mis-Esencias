<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isLocal"></video>
    <audio ref="audioEl" autoplay :muted="isLocal"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { type Participant, ParticipantEvent, type TrackPublication, Track } from 'livekit-client';

const props = defineProps<{
  participant: Participant;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

const isLocal = props.participant.isLocal;

const handleTrackSubscribed = (track: any, publication: TrackPublication) => {
  if (publication.source === Track.Source.Camera) {
    track.attach(videoEl.value!);
  }
  if (publication.source === Track.Source.Microphone) {
    track.attach(audioEl.value!);
  }
};

const handleTrackUnsubscribed = (track: any) => {
  track.detach();
};

const setupListeners = (p: Participant) => {
  // Adjuntar tracks existentes
  p.getTrackPublications().forEach(pub => {
    if (pub.track) handleTrackSubscribed(pub.track, pub);
  });
  
  p.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
  p.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
};

const cleanupListeners = (p: Participant) => {
  p.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
  p.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
};

watch(() => props.participant, (newP, oldP) => {
  if (oldP) cleanupListeners(oldP);
  if (newP) setupListeners(newP);
}, { immediate: true });

onUnmounted(() => {
  if (props.participant) cleanupListeners(props.participant);
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
/* Si el participante es local, espejeamos el video */
.participant-view:has(video[muted]) video {
    transform: scaleX(-1);
}
</style>