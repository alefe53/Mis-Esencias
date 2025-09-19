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
import { ref, watch, onUnmounted, computed, shallowRef, nextTick, watchEffect } from 'vue';
import { 
  type Track as LiveKitTrack,
  type TrackPublication
} from 'livekit-client';

const props = defineProps<{
  publication: TrackPublication | null;
  isMuted?: boolean;
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const attachedTrack = shallowRef<LiveKitTrack | null>(null);

const isVideoEnabled = computed(() => {
  return props.publication?.track && !props.publication.isMuted;
});

watchEffect(() => {
    console.log(`[ParticipantViewV2] -> 👁️‍🗨️ Estado render:`, {
        source: props.publication?.source ?? 'N/A',
        hasTrack: !!props.publication?.track,
        isMuted: props.publication?.isMuted,
        isVideoEnabled: isVideoEnabled.value
    });
});

async function attachTrackToEl(track: LiveKitTrack | null) {
  await nextTick();
  if (!track) return;
  
  const el = track.kind === 'video' ? videoEl.value : audioEl.value;
  if (!el) return;

  try {
    track.attach(el);
    console.log(`[ParticipantViewV2] -> ✅ Attach inicial de track ${track.sid}.`);

    // Lógica para el video: verificar si se está renderizando.
    if (track.kind === 'video' && el instanceof HTMLVideoElement) {
      // Intentamos darle play, puede ser necesario por políticas del navegador
      try {
        await el.play();
      } catch (e) {
        // Ignoramos errores de autoplay, el attach es lo importante
      }

      // Esperamos un momento para que el navegador procese los frames
      setTimeout(() => {
        if (el.videoWidth === 0 && el.videoHeight === 0) {
          console.warn(`[ParticipantViewV2] -> ⚠️ No se detectan frames en el video ${track.sid}. Reintentando attach...`);
          // Forzamos un re-attach
          track.detach(el);
          track.attach(el);
        } else {
          console.log(`[ParticipantViewV2] -> ✨ Frames detectados para ${track.sid} (${el.videoWidth}x${el.videoHeight}).`);
        }
      }, 300); // Un delay de 300ms suele ser suficiente
    }
  } catch (err) {
    console.warn(`[ParticipantViewV2] -> ⚠️ Attach del track ${track.sid} falló:`, err);
  }
}

watch(() => props.publication, (newPub) => {
    if (attachedTrack.value) {
        try { attachedTrack.value.detach(); } catch (e) { /* ignorar */ }
        attachedTrack.value = null;
    }

    if (!newPub) return;

    if (newPub.track) {
        attachedTrack.value = newPub.track;
        attachTrackToEl(newPub.track);
        return;
    }

    const onSubscribed = (track: LiveKitTrack) => {
        attachedTrack.value = track;
        attachTrackToEl(track);
        newPub.off('subscribed', onSubscribed);
    };
    newPub.on('subscribed', onSubscribed);
  },
  { immediate: true }
);

onUnmounted(() => {
  if (attachedTrack.value) {
    try { attachedTrack.value.detach(); } catch (e) { /* ignorar */ }
  }
});
</script>

<style scoped>
.participant-view { width: 100%; height: 100%; position: relative; background-color: #000; overflow: hidden; }
video, audio { width: 100%; height: 100%; object-fit: contain; }
.no-video-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: #111827; color: #a0a0a0; }
audio { display: none; }
</style>