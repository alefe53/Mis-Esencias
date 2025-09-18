<template>
  <div class="participant-view">
    <video ref="videoEl" autoplay playsinline :muted="isLocal"></video>
    <audio ref="audioEl" autoplay :muted="isLocal"></audio>
    <div v-if="!isVideoActive" class="no-video-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, shallowRef } from 'vue';
import { type Participant, ParticipantEvent, type TrackPublication, Track, type LocalTrack, type RemoteTrack } from 'livekit-client';

const props = defineProps<{
  participant: Participant;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const isVideoActive = ref(false);

const isLocal = props.participant.isLocal;

// Guardamos una referencia al track de video actual para poder desadjuntarlo
const activeVideoTrack = shallowRef<LocalTrack | RemoteTrack | undefined>(undefined);

const updateCameraTrack = () => {
  if (!props.participant || !videoEl.value) return;

  const cameraPub = props.participant.getTrackPublication(Track.Source.Camera);

  if (cameraPub?.track && cameraPub.isSubscribed) {
    if (activeVideoTrack.value !== cameraPub.track) {
      if (activeVideoTrack.value) {
        activeVideoTrack.value.detach(videoEl.value);
      }
      
      // CORRECCIÓN: Hacemos una afirmación de tipo para que TypeScript sepa que este track es "adjuntable"
      const attachableTrack = cameraPub.track as LocalTrack | RemoteTrack;
      
      attachableTrack.attach(videoEl.value);
      activeVideoTrack.value = attachableTrack;
    }
    isVideoActive.value = true;
  } else {
    if (activeVideoTrack.value) {
      activeVideoTrack.value.detach(videoEl.value);
      activeVideoTrack.value = undefined;
    }
    isVideoActive.value = false;
  }
};

const updateAudioTrack = () => {
    if (!props.participant || !audioEl.value) return;
    const audioPub = props.participant.getTrackPublication(Track.Source.Microphone);
    if (audioPub?.track && audioPub.isSubscribed) {
        // También aplicamos la corrección aquí por consistencia
        const attachableTrack = audioPub.track as LocalTrack | RemoteTrack;
        attachableTrack.attach(audioEl.value);
    }
};

const handlePublicationsChanged = () => {
  updateCameraTrack();
  updateAudioTrack();
};

const setupListeners = (p: Participant) => {
  p.on(ParticipantEvent.TrackPublished, handlePublicationsChanged);
  p.on(ParticipantEvent.TrackUnpublished, handlePublicationsChanged);
  p.on(ParticipantEvent.TrackSubscribed, handlePublicationsChanged);
  p.on(ParticipantEvent.TrackUnsubscribed, handlePublicationsChanged);
  p.on(ParticipantEvent.TrackMuted, handlePublicationsChanged);
  p.on(ParticipantEvent.TrackUnmuted, handlePublicationsChanged);
  
  handlePublicationsChanged();
};

const cleanupListeners = (p: Participant) => {
  p.off(ParticipantEvent.TrackPublished, handlePublicationsChanged);
  p.off(ParticipantEvent.TrackUnpublished, handlePublicationsChanged);
  p.off(ParticipantEvent.TrackSubscribed, handlePublicationsChanged);
  p.off(ParticipantEvent.TrackUnsubscribed, handlePublicationsChanged);
  p.off(ParticipantEvent.TrackMuted, handlePublicationsChanged);
  p.off(ParticipantEvent.TrackUnmuted, handlePublicationsChanged);
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
  background-color: #111827; /* Un fondo oscuro por si no hay video */
}
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-video-placeholder {
  display: none;
}
/* Si el participante es local, espejeamos el video */
.participant-view:has(video[muted]) video {
    transform: scaleX(-1);
}
</style>