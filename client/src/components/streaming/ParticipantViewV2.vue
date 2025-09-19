// RUTA: src/components/streaming/ParticipantViewV2.vue
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
// ▼▼▼ CORRECCIÓN DE IMPORTACIÓN ▼▼▼
import { 
  Track as LiveKitTrack, // Renombramos 'Track' a 'LiveKitTrack' para evitar conflictos
  type TrackPublication,   // Mantenemos 'type' para las que son solo tipos
} from 'livekit-client';
// ▲▲▲ FIN DE CORRECCIÓN ▲▲▲

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
        trackSid: props.publication?.trackSid ?? 'N/A',
        hasTrack: !!props.publication?.track,
        isMuted: props.publication?.isMuted,
        isVideoEnabled: isVideoEnabled.value
    });
});

async function attachTrackToEl(track: LiveKitTrack | null) {
  await nextTick();
  if (!track) return;

  try {
    const el = track.kind === 'video' ? videoEl.value : audioEl.value;
    if (el) {
      track.attach(el);
      console.log(`[ParticipantViewV2] -> ✅ Attach exitoso de track ${track.sid} a elemento.`);
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
        console.log(`[ParticipantViewV2] -> ✨ Track ${track.sid} suscrito, procediendo a attach.`);
        attachedTrack.value = track;
        attachTrackToEl(track);
        // ▼▼▼ USAMOS EL ALIAS 'LiveKitTrack' ▼▼▼
        newPub.off('subscribed', onSubscribed);
    };
    // ▼▼▼ USAMOS EL ALIAS 'LiveKitTrack' ▼▼▼
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