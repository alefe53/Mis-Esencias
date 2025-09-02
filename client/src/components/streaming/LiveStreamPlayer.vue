<template>
  <div class="livestream-player-container">
    <div class="stream-header">
      <div class="live-indicator">
        <span class="live-dot"></span>
        EN VIVO
      </div>
      <div class="viewer-count">
        <span class="icon">👀</span>
        <span>{{ participantCount }}</span>
      </div>
    </div>

    <div class="video-grid">
      <template v-if="room && adminParticipant">
        <div class="video-wrapper">
          <ParticipantView
            :publication="mainPublication as TrackPublication | null"
            :is-local="false"
            class="main-video"
            :class="{
              'fill-container': !isScreenSharing || isCameraFullScreen,
            }"
          />
          <div
            v-if="
              isScreenSharing &&
              !isCameraFullScreen &&
              cameraTrackPub &&
              isCameraOverlayEnabled
            "
            class="camera-overlay"
            :style="cameraOverlayStyle"
          >
            <ParticipantView
              :publication="cameraTrackPub as TrackPublication | null"
              :is-local="false"
            />
          </div>
          <ParticipantView
            :publication="audioTrackPub as TrackPublication | null"
            :is-local="false"
            class="audio-handler"
          />

          <div
            v-if="!userHasUnmuted"
            class="unmute-overlay"
            @click="unmutePlayer"
          >
            <span class="unmute-icon">🔇</span>
            <span class="unmute-text">Toca para activar el sonido</span>
          </div>
        </div>
      </template>

      <div v-else-if="isConnecting" class="stream-placeholder">
        <p>Conectando al stream...</p>
      </div>

      <div v-else class="stream-placeholder">
        <p>Esperando la señal del streamer...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStreamingStore } from '../../stores/streamingStore'
import { useParticipantTracks } from '../../composables/useParticipantTracks'
import ParticipantView from './ParticipantView.vue'
import type { TrackPublication } from 'livekit-client'

const streamingStore = useStreamingStore()
const {
  participantCount,
  adminParticipant,
  room,
  isConnecting,
  cameraOverlayPosition,
  cameraOverlaySize,
  isCameraFullScreen,
  isCameraOverlayEnabled,
  // Ya no traemos 'isScreenSharing' desde el store para la lógica de la UI
  isScreenSharing, // <-- ¡Importamos este! Es la única fuente de la verdad
} = storeToRefs(streamingStore)
const { connectToView, disconnect } = streamingStore

const userHasUnmuted = ref(false)

// Obtenemos los nuevos y robustos estados reactivos desde el composable.
const { cameraTrackPub, screenShareTrackPub, audioTrackPub } =
  useParticipantTracks(adminParticipant)

const mainPublication = computed(() => {
  if (isCameraFullScreen.value) {
    return cameraTrackPub.value
  }
  // Usamos el estado reactivo del store, que se actualiza con los eventos del admin
  if (isScreenSharing.value && screenShareTrackPub.value) {
    return screenShareTrackPub.value
  }
  return cameraTrackPub.value
})

const cameraOverlayStyle = computed(() => ({
  top: `${cameraOverlayPosition.value.y}%`,
  left: `${cameraOverlayPosition.value.x}%`,
  width: `${cameraOverlaySize.value.width}%`,
}))

const unmutePlayer = async () => {
  if (userHasUnmuted.value) return
  userHasUnmuted.value = true
  if (room.value) {
    try {
      await room.value.startAudio()
    } catch (e) {
      console.error('No se pudo iniciar el audio:', e)
    }
  }
}

watch(
  adminParticipant,
  (newAdmin, _oldAdmin) => {
    if (newAdmin) {
      console.log(
        `[LiveStreamPlayer] ¡Detectado admin en el store! ID: ${newAdmin.identity}`,
      )
    } else {
      console.log('[LiveStreamPlayer] El admin ha desaparecido del store.')
    }
  },
  { immediate: true },
)

onMounted(() => {
  console.log('[LiveStreamPlayer] Montado. Conectando para ver...')
  connectToView()
})

onUnmounted(() => {
  console.log('[LiveStreamPlayer] Desmontado. Desconectando...')
  if (room.value) {
    disconnect()
  }
})
</script>

<style scoped>
.camera-overlay {
  position: absolute;
  min-width: 160px;
  max-width: 80%;
  aspect-ratio: 16 / 9;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  transition:
    top 0.3s ease,
    left 0.3s ease,
    width 0.3s ease,
    opacity 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.livestream-player-container {
  border: 1px solid #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  border-radius: 12px;
  margin-bottom: 2.5rem;
  background-color: #111827;
  overflow: hidden;
}
.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: rgba(239, 68, 68, 0.2);
}
.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: #f87171;
  text-transform: uppercase;
  font-size: 0.9rem;
}
.live-dot {
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
.viewer-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fca5a5;
}
.video-grid {
  padding: 0;
  aspect-ratio: 16 / 9;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #000;
}
.video-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
.main-video {
  width: 100%;
  height: 100%;
}
.main-video :deep(video) {
  object-fit: contain;
}
.main-video.fill-container :deep(video) {
  object-fit: cover;
}
.stream-placeholder {
  color: #9ca3af;
  font-style: italic;
}
.unmute-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}
.video-wrapper:hover .unmute-overlay {
  opacity: 1;
}
.unmute-icon {
  font-size: 2.5rem;
}
.unmute-text {
  margin-top: 0.5rem;
  font-weight: bold;
}
.audio-handler {
  display: none;
  visibility: hidden;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
