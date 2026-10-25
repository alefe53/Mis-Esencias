<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container">
        <template v-if="!localParticipant">
          <video
            ref="previewVideoRef"
            autoplay
            muted
            playsinline
            class="preview-video"
          ></video>
          <div class="placeholder-content">
            <p v-if="streamState.permissionError">
              {{ streamState.permissionError }}
            </p>
            <p v-else-if="!previewTrack">Solicitando permisos de cámara...</p>
            <p v-else>Cámara lista para la vista previa.</p>
            <button
              @click="enterStudio"
              :disabled="
                streamState.isConnecting ||
                !previewTrack ||
                !!streamState.permissionError
              "
            >
              {{
                streamState.isConnecting ? 'Entrando...' : '▶️ Entrar al Studio'
              }}
            </button>
          </div>
        </template>

        <template v-else>
          <ParticipantViewV2
            :publication="mainViewPublication"
            class="main-video"
          />

          <CameraOverlay
            v-if="showOverlay"
            :publication="overlayViewPublication"
            :position="streamState.cameraOverlay.position"
            :size="streamState.cameraOverlay.size"
          />

          <div v-if="!mainViewPublication" class="no-video-placeholder">
            📷 Apaga y enciende la cámara para empezar.
          </div>
        </template>
      </div>

      <div class="controls-section" v-if="localParticipant">
        <div class="device-controls">
          <button
            v-if="streamState.isPublishing !== 'active'"
            @click="publishMedia"
            :disabled="streamState.isPublishing === 'pending'"
            class="start-publish-btn"
          >
            {{
              streamState.isPublishing === 'pending'
                ? 'Publicando...'
                : '🚀 Publicar Media'
            }}
          </button>

          <template v-else>
            <button
              v-if="streamState.broadcastState !== 'live'"
              @click="startBroadcast"
              :disabled="streamState.broadcastState === 'starting'"
              class="start-broadcast-btn"
            >
              {{
                streamState.broadcastState === 'starting'
                  ? 'Empezando...'
                  : '📡 Empezar Transmisión'
              }}
            </button>
            <button
              v-if="
                streamState.broadcastState === 'live' ||
                streamState.broadcastState === 'ending'
              "
              @click="stopBroadcast"
              :disabled="streamState.broadcastState === 'ending'"
              class="stop-broadcast-btn"
            >
              {{
                streamState.broadcastState === 'ending'
                  ? 'Finalizando...'
                  : '🔴 Finalizar Transmisión'
              }}
            </button>

            <button
              @click="toggleCamera"
              :class="{ 'is-off': !streamState.isCameraEnabled }"
              :disabled="isActionPending"
            >
              {{
                streamState.isCameraEnabled
                  ? '📷 Apagar Cámara'
                  : '📷 Encender Cámara'
              }}
            </button>
            <button
              @click="toggleMicrophone"
              :class="{ 'is-off': !streamState.isMicrophoneEnabled }"
              :disabled="isActionPending"
            >
              {{
                streamState.isMicrophoneEnabled
                  ? '🎤 Silenciar'
                  : '🎤 Activar Mic'
              }}
            </button>
            <button
              @click="toggleScreenShare"
              :class="{ 'is-sharing': streamState.isScreenSharing }"
              :disabled="isActionPending"
            >
              {{
                streamState.isScreenSharing
                  ? '🖥️ Dejar de Compartir'
                  : '🖥️ Compartir'
              }}
            </button>
          </template>
        </div>

        <div class="overlay-controls" v-if="streamState.isScreenSharing">
          <select
            :value="streamState.cameraOverlay.size"
            @change="handleSizeChange"
            class="control-select"
            aria-label="Seleccionar tamaño del overlay de cámara"
          >
            <option value="sm">Pequeña</option>
            <option value="md">Mediana</option>
            <option value="lg">Grande</option>
          </select>
          <button
            @click="cycleCameraOverlayPosition"
            class="control-button"
            title="Cambiar posición del overlay"
          >
            🔄 Posición
          </button>
          <button
            @click="toggleCameraFocus"
            class="control-button"
            :class="{ 'is-active': streamState.cameraOverlay.isCameraFocus }"
            title="Destacar cámara"
          >
            👤 Destacar
          </button>
        </div>
        <div class="stream-actions">
          <button @click="leaveStudio(true)" class="disconnect-btn">
            🚪 Salir del Studio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// El script se mantiene exactamente igual que en la versión anterior. No necesita cambios.
import { onMounted, onUnmounted, ref, watch, computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useStreamingStoreV2 } from '../stores/streamingStoreV2'
import { useParticipantTracksV2 } from '../composables/streaming/useParticipantTracksV2'
import { useStreamLayout } from '../composables/streaming/useStreamLayout'
import type { OverlaySize } from '../composables/streaming/useStreamStateV2'
import ParticipantViewV2 from '../components/streaming/ParticipantViewV2.vue'
import CameraOverlay from '../components/streaming/CameraOverlay.vue'

const streamingStore = useStreamingStoreV2()
const streamState = computed(() => streamingStore.streamState)
const { previewTrack, isActionPending, localParticipant } =
  storeToRefs(streamingStore)
const {
  getPermissionsAndPreview,
  enterStudio,
  leaveStudio,
  publishMedia,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  setCameraOverlaySize,
  cycleCameraOverlayPosition,
  toggleCameraFocus,
  startBroadcast,
  stopBroadcast,
} = streamingStore
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const { cameraPublication, screenSharePublication } =
  useParticipantTracksV2(localParticipant)
const layoutController = computed(() => ({
  isScreenSharing: streamState.value.isScreenSharing,
  isCameraFocus: streamState.value.cameraOverlay.isCameraFocus,
  isCameraEnabled: streamState.value.isCameraEnabled,
}))
const { mainViewPublication, overlayViewPublication, showOverlay } =
  useStreamLayout(layoutController, {
    camera: cameraPublication,
    screen: screenSharePublication,
  })

watchEffect(() => {
  console.log('[AdminView-Layout] -> 🕵️‍♂️ Estado del layout recalculado:', {
    mainSource: mainViewPublication.value?.source ?? 'Ninguna',
    overlaySource: overlayViewPublication.value?.source ?? 'Ninguna',
    showOverlay: showOverlay.value,
    isCameraFocus_state: streamState.value.cameraOverlay.isCameraFocus,
  })
})

const handleSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (target) {
    setCameraOverlaySize(target.value as OverlaySize)
  }
}

watch(
  [previewVideoRef, previewTrack],
  ([videoEl, track]) => {
    if (videoEl && track) {
      track.attach(videoEl)
    }
  },
  { immediate: true },
)

onMounted(() => {
  getPermissionsAndPreview()
})
onUnmounted(() => {
  leaveStudio()
})
</script>

<style scoped>
/* Los estilos se mantienen exactamente igual que en tu versión. No necesitan cambios. */
.admin-stream-layout {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(17, 24, 39, 0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}
.stream-panel-full {
  width: 100%;
  max-width: 1280px;
  height: 95%;
  display: flex;
  flex-direction: column;
  background-color: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  gap: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.video-container {
  flex-grow: 1;
  background-color: black;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
.preview-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}
.main-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.no-video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  font-size: 1.5rem;
  background-color: #111827;
  z-index: 2;
}
.placeholder-content {
  position: relative;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  text-align: center;
}
.placeholder-content button {
  margin-top: 1rem;
  background-color: #2563eb;
  color: white;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6em 1.2em;
  font-size: 1em;
  cursor: pointer;
  border: none;
}
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #374151;
}
.device-controls,
.overlay-controls,
.stream-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.device-controls button,
.stream-actions button,
.control-button {
  background-color: #4b5563;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.device-controls button:hover,
.stream-actions button:hover,
.control-button:hover {
  background-color: #6b7280;
}
.device-controls button.is-off {
  background-color: #be123c;
}
.start-publish-btn {
  background-color: #1d4ed8 !important;
}
.disconnect-btn {
  background-color: #991b1b !important;
}
.start-broadcast-btn {
  background-color: #059669 !important;
}
.stop-broadcast-btn {
  background-color: #dc2626 !important;
}
button:disabled {
  background-color: #374151 !important;
  cursor: not-allowed;
  opacity: 0.7;
}
.device-controls button.is-sharing {
  background-color: #059669;
  box-shadow: 0 0 8px #10b981;
}
.main-video :deep(video) {
  object-fit: contain;
}
.overlay-controls {
  background-color: rgba(30, 41, 59, 0.5);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}
.control-select {
  background-color: #4b5563;
  color: white;
  border: 1px solid #6b7280;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.control-select:hover {
  background-color: #6b7280;
}
.control-button.is-active {
  background-color: #2563eb;
  border-color: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
}
</style>
