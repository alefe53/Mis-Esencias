<template>
  <div :class="['participant-view', { 'is-local': isLocal }]">
    <video
      ref="videoEl"
      autoplay
      playsinline
      :muted="isLocal"
      class="participant-video"
    ></video>
    <div v-if="!isVideoEnabled" class="no-video-placeholder">
      <slot name="placeholder">Sin video</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { type TrackPublication, type Track } from 'livekit-client'

const props = defineProps<{
  publication: TrackPublication | null
  isLocal?: boolean
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const isVideoEnabled = ref(false)

// Esta función ahora toma un Track, es más simple.
const attach = (track: Track) => {
  if (!videoEl.value) return
  try {
    track.attach(videoEl.value)
    isVideoEnabled.value = true
  } catch (e) {
    console.error('Error al adjuntar el track:', e)
  }
}

// Esta función ahora toma un Track, es más simple.
const detach = (track: Track) => {
  if (!videoEl.value) return
  try {
    track.detach(videoEl.value)
  } catch (e) {
    console.error('Error al desadjuntar el track:', e)
  } finally {
    videoEl.value.srcObject = null
    isVideoEnabled.value = false
  }
}

// ✅ LÓGICA CLAVE CORREGIDA Y SIMPLIFICADA
// Usamos un solo 'watch' para observar directamente la propiedad 'track'
// dentro de la publicación que recibimos como prop.
watch(
  () => props.publication?.track,
  (newTrack, oldTrack) => {
    if (oldTrack) {
      // Si había un track anterior, lo desadjuntamos.
      detach(oldTrack)
    }
    if (newTrack) {
      // Si hay un nuevo track (porque nos suscribimos o es local), lo adjuntamos.
      attach(newTrack)
    } else {
      // Si no hay track, nos aseguramos de que el video esté limpio.
      if (videoEl.value) {
        videoEl.value.srcObject = null
      }
      isVideoEnabled.value = false
    }
  },
  { immediate: true }, // 'immediate' se asegura de que se ejecute al montar el componente.
)

onUnmounted(() => {
  // Limpieza final
  if (props.publication?.track) {
    detach(props.publication.track)
  }
})
</script>

<style scoped>
.participant-view {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
.participant-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.no-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b0b0;
  font-weight: 600;
  pointer-events: none;
}
</style>
