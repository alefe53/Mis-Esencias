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

watch(() => props.publication?.track, (_newTrack, oldTrack) => {
  if (oldTrack) {
    console.log(`[ParticipantView] -> Detaching old track ${oldTrack.sid} because track prop changed.`);
    oldTrack.detach();
  }
});

watch(
  [() => props.publication?.track, videoEl, audioEl],
  ([track, vEl, aEl], [_oldTrack, _oldVEl, _oldAEl]) => {
    console.log(`[ParticipantView] Attach watcher fired for track: ${track?.sid}. Video element ready: ${!!vEl}`);

    if (!track) {
      return;
    }

    if (track.kind === 'video') {
      if (vEl) {
        console.log(`[ParticipantView] -> ✅ Attaching video track ${track.sid} to element.`);
        track.attach(vEl);
      } else {
        console.log(`[ParticipantView] -> ⏳ Video element not ready yet for track ${track.sid}.`);
      }
    } else if (track.kind === 'audio') {
      if (aEl) {
        console.log(`[ParticipantView] -> ✅ Attaching audio track ${track.sid} to element.`);
        track.attach(aEl);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
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