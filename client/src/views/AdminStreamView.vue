<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container" ref="videoContainerRef">
        <template v-if="room">
          <ParticipantView
            :publication="mainPublication as TrackPublication | null"
            :is-local="true" class="main-video"
            :class="{
              'fill-container': !isScreenSharing || isCameraFullScreen,
            }"
          />
          <div
            v-if="
              !isCameraFullScreen && isScreenSharing && localCameraPublication
            "
            ref="cameraOverlayRef"
            class="camera-overlay"
            :style="cameraOverlayStyle"
          >
            <ParticipantView
              class="overlay-participant"
              :publication="localCameraPublication as TrackPublication | null"
              :is-local="true" />
          </div>
        </template>
        <div v-else class="placeholder">
          <video
            ref="previewVideoRef"
            autoplay
            muted
            playsinline
            class="preview-video"
          ></video>
          <div class="placeholder-content">
            <p v-if="isCheckingPermissions">Verificando permisos...</p>
            <p v-else-if="permissionError">{{ permissionError }}</p>
            <p v-else-if="!localVideoTrack">
              Cámara lista para la vista previa.
            </p>
            <button
              @click="handleConnectWithoutPublishing"
              :disabled="isConnecting || !localVideoTrack || !!permissionError"
            >
              {{ isConnecting ? 'Conectando...' : '▶️ Entrar al Studio' }}
            </button>
          </div>
        </div>
      </div>
      <div class="controls-section" v-if="room">
        <div class="device-controls">
          <button
            @click="toggleCamera(!localParticipant?.isCameraEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !localParticipant?.isCameraEnabled }"
          >
            {{
              localParticipant?.isCameraEnabled ? '📷 Apagar' : '📷 Encender'
            }}
          </button>
          <button
            @click="toggleMicrophone(!localParticipant?.isMicrophoneEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !localParticipant?.isMicrophoneEnabled }"
          >
            {{
              localParticipant?.isMicrophoneEnabled
                ? '🎤 Silenciar'
                : '🎤 Activar'
            }}
          </button>
          <button
            @click="toggleScreenShare"
            :class="{ 'is-sharing': isScreenSharing }"
            :disabled="!isPublishing"
          >
            {{ isScreenSharing ? '🖥️ Dejar de Compartir' : '🖥️ Compartir' }}
          </button>
        </div>
        <div class="device-selectors">
          <div class="device-selector">
            <label for="cam-select">Cámara:</label>
            <select
              id="cam-select"
              :value="activeCameraId"
              @change="onCameraChange"
              :disabled="isPublishing"
            >
              <option
                v-for="cam in availableCameras"
                :key="cam.id"
                :value="cam.id"
              >
                {{ cam.label }}
              </option>
            </select>
          </div>
          <div class="device-selector">
            <label for="mic-select">Micrófono:</label>
            <select
              id="mic-select"
              :value="activeMicId"
              @change="onMicChange"
              :disabled="isPublishing"
            >
              <option
                v-for="mic in availableMics"
                :key="mic.id"
                :value="mic.id"
              >
                {{ mic.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="stream-actions">
          <div class="info">
            <p>👀 Espectadores: {{ participantCount }}</p>
          </div>
          <div v-if="isScreenSharing" class="overlay-buttons">
            <button @click="setOverlayPosition('top-left')">↖️</button>
            <button @click="setOverlayPosition('top-right')">↗️</button>
            <button @click="setOverlayPosition('bottom-left')">↙️</button>
            <button @click="setOverlayPosition('bottom-right')">↘️</button>
            <button @click="setOverlaySize('small')">S</button>
            <button @click="setOverlaySize('medium')">M</button>
            <button @click="setOverlaySize('large')">L</button>
            <button
              @click="toggleCameraFullScreen"
              class="toggle-fullscreen-btn"
            >
              {{ isCameraFullScreen ? 'Volver a Overlay' : 'Cámara Completa' }}
            </button>
          </div>
          <button
            v-if="!isPublishing"
            @click="startPublishing"
            class="start-publish-btn"
          >
            🚀 Publicar Media
          </button>
          <button v-else @click="stopPublishing" class="pause-stream-btn">
            ⏸️ Dejar de Publicar
          </button>
          <button
            v-if="isPublishing && !isStreamLive"
            @click="goLive"
            class="go-live-btn"
          >
            🔴 Transmitir EN VIVO
          </button>
          <button v-if="isStreamLive" @click="endStream" class="stop-live-btn">
            🛑 Detener EN VIVO
          </button>
          <button @click="disconnect" class="disconnect-btn">
            🚪 Salir del Studio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStreamingStore } from '../stores/streamingStore'
import ParticipantView from '../components/streaming/ParticipantView.vue'
import {
  createLocalVideoTrack,
  type LocalVideoTrack,
  Room,
  type TrackPublication,
} from 'livekit-client'
import { useParticipantTracks } from '../composables/useParticipantTracks'
import { useInteractableOverlay } from '../composables/useInteractableOverlay'

const streamingStore = useStreamingStore()
const {
  room,
  isConnecting,
  isScreenSharing,
  localParticipant,
  participantCount,
  availableCameras,
  availableMics,
  activeCameraId,
  activeMicId,
  cameraOverlayPosition,
  cameraOverlaySize,
  isCameraFullScreen,
  isPublishing,
  isStreamLive,
} = storeToRefs(streamingStore)

const {
  disconnect,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  changeCamera,
  changeMicrophone,
  setOverlayPosition,
  setOverlaySize,
  toggleCameraFullScreen,
  connectWithoutPublishing,
  startPublishing,
  stopPublishing,
  goLive,
  endStream,
  updateCameraOverlayPosition,
  updateCameraOverlaySize,
} = streamingStore

const videoContainerRef = ref<HTMLDivElement | null>(null)
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const localVideoTrack = ref<LocalVideoTrack | null>(null)
const permissionError = ref<string>('')
const isCheckingPermissions = ref(true)
const cameraOverlayRef = ref<HTMLDivElement | null>(null)
const cameraResizeHandleRef = ref<HTMLDivElement | null>(null)

useInteractableOverlay(cameraOverlayRef, cameraResizeHandleRef, {
  position: cameraOverlayPosition,
  size: cameraOverlaySize,
  onDragEnd: updateCameraOverlayPosition,
  onResizeEnd: updateCameraOverlaySize,
})

const {
  cameraTrackPub: localCameraPublication,
  screenShareTrackPub: localScreenSharePublication,
} = useParticipantTracks(localParticipant)

const mainPublication = computed(() => {
  if (isCameraFullScreen.value && localCameraPublication.value) {
    return localCameraPublication.value
  }
  if (isScreenSharing.value && localScreenSharePublication.value) {
    return localScreenSharePublication.value
  }
  return localCameraPublication.value
})

const cameraOverlayStyle = computed(() => ({
  top: `${cameraOverlayPosition.value.y}%`,
  left: `${cameraOverlayPosition.value.x}%`,
  width: `${cameraOverlaySize.value.width}%`,
}))

const enablePreview = async () => {
  if (localVideoTrack.value) {
    localVideoTrack.value.stop()
  }
  permissionError.value = ''
  isCheckingPermissions.value = true

  try {
    await Room.getLocalDevices('videoinput', true)
    await Room.getLocalDevices('audioinput', true)

    localVideoTrack.value = await createLocalVideoTrack({
      resolution: { width: 1280, height: 720, frameRate: 30 },
    })

    if (previewVideoRef.value) {
      localVideoTrack.value.attach(previewVideoRef.value)
    }
  } catch (error: any) {
    if (
      error.name === 'NotAllowedError' ||
      error.name === 'PermissionDeniedError'
    ) {
      permissionError.value =
        'Permiso para acceder a la cámara denegado. Revísalo en la configuración de tu navegador.'
    } else if (
      error.name === 'NotFoundError' ||
      error.name === 'DevicesNotFoundError'
    ) {
      permissionError.value = 'No se encontró ninguna cámara conectada.'
    } else {
      permissionError.value =
        'Ocurrió un error desconocido al acceder a la cámara.'
    }
  } finally {
    isCheckingPermissions.value = false
  }
}

const disablePreview = () => {
  if (localVideoTrack.value) {
    localVideoTrack.value.stop()
    localVideoTrack.value.detach()
    localVideoTrack.value = null
  }
}

const handleConnectWithoutPublishing = async () => {
  if (!localVideoTrack.value) {
    alert('La cámara no está lista. Por favor, concede los permisos.')
    return
  }
  disablePreview()
  await connectWithoutPublishing()
}

const onCameraChange = (event: Event) => {
  const deviceId = (event.target as HTMLSelectElement).value
  changeCamera(deviceId)
}

const onMicChange = (event: Event) => {
  const deviceId = (event.target as HTMLSelectElement).value
  changeMicrophone(deviceId)
}

let chatPopupWindow: Window | null = null

const openChatPopup = () => {
  const width = 400
  const height = 700
  const left = window.screen.width - width - 50
  const top = 100
  const windowFeatures = `width=${width},height=${height},left=${left},top=${top},popup=true`
  if (chatPopupWindow === null || chatPopupWindow.closed) {
    chatPopupWindow = window.open('/chat-popup', 'chatWindow', windowFeatures)
  } else {
    chatPopupWindow.focus()
  }
}

const closeChatPopup = () => {
  if (chatPopupWindow && !chatPopupWindow.closed) {
    chatPopupWindow.close()
  }
}

onMounted(() => {
  if (!room.value) {
    enablePreview()
  }
  openChatPopup()
})

onUnmounted(() => {
  disablePreview()
  closeChatPopup()
  if (room.value) {
    disconnect()
  }
})
</script>

<style scoped>
.camera-overlay {
  position: absolute;
  aspect-ratio: 16 / 9;
  border: 2px solid #4b5563;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}
.camera-overlay .overlay-participant {
  pointer-events: none;
}
.fullscreen-camera {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  transition: all 0.3s ease;
}
.fullscreen-camera .fullscreen-participant {
  width: 100%;
  height: 100%;
}
.admin-stream-layout {
  padding: 1rem;
  height: calc(100vh - 150px);
}
.stream-panel-full {
  display: flex;
  flex-direction: column;
  background-color: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  gap: 1rem;
  height: 100%;
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
.main-video {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}
.main-video :deep(video),
.main-video :deep(audio) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.main-video.fill-container :deep(video) {
  object-fit: cover;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.placeholder-content {
  position: relative;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
}
.preview-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transform: scaleX(-1);
}
.placeholder button {
  font-size: 1.2rem;
  padding: 0.8rem 1.5rem;
  margin-top: 1rem;
}
.placeholder p {
  font-weight: 500;
}
.placeholder button:disabled {
  background-color: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
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
.device-selectors,
.stream-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}
.controls-section button {
  background-color: #374151;
  transition: background-color 0.2s;
  font-weight: 500;
  border-radius: 6px;
  padding: 0.6rem 1rem;
}
.controls-section button:hover:not(:disabled) {
  background-color: #4b5563;
}
.controls-section button:disabled {
  background-color: #2d3748;
  color: #6b7280;
  cursor: not-allowed;
}
.controls-section button.is-off {
  background-color: #991b1b;
}
.controls-section button.is-sharing {
  background-color: #1d4ed8;
}
.start-publish-btn {
  background-color: #1d4ed8;
}
.pause-stream-btn {
  background-color: #d97706;
}
.go-live-btn {
  background-color: #16a34a;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 15px rgba(22, 163, 74, 0.6);
}
.stop-live-btn {
  background-color: #dc2626;
  font-weight: bold;
  color: white;
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
}
.disconnect-btn {
  background-color: #52525b;
}
.device-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.device-selector label {
  font-size: 0.9rem;
}
.device-selector select {
  background-color: #4b5563;
  border: 1px solid #6b7280;
  padding: 0.5rem;
  border-radius: 4px;
}
.device-selector select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.info {
  font-weight: 500;
}
.overlay-buttons {
  display: flex;
  gap: 0.2rem;
  background-color: #374151;
  padding: 0.25rem;
  border-radius: 6px;
  flex-wrap: wrap;
}
.overlay-buttons button {
  padding: 0.5rem;
  font-size: 0.75rem;
}
.toggle-fullscreen-btn {
  background-color: #4f46e5;
}
@media (max-width: 768px) {
  .admin-stream-layout {
    padding: 0.5rem;
    height: calc(100vh - 80px); 
  }

  .stream-panel-full {
    padding: 0.5rem;
  }

  .controls-section {
    flex-direction: column;
    align-items: stretch; 
    gap: 1.5rem; 
  }

  .device-controls,
  .device-selectors,
  .stream-actions {
    justify-content: center; 
    width: 100%;
  }

  .device-selectors {
    flex-direction: column;
    align-items: stretch; 
  }

  .device-selector select {
    width: 100%; 
  }
  
  .stream-actions {
    flex-direction: column; 
  }

  .stream-actions button {
    width: 100%; 
  }
  
  .overlay-buttons {
    justify-content: center;
  }
}
</style>