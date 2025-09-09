<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container" ref="videoContainerRef">
        <template v-if="room">
          <ParticipantView
            :publication="mainPublication as TrackPublication | null"
            :is-local="true"
            class="main-video"
            :class="{
              'fill-container': !isScreenSharing || isCameraFullScreen,
            }"
          />
          <div
            v-if="
              !isCameraFullScreen &&
              isScreenSharing &&
              isCameraOverlayEnabled
            "
            ref="cameraOverlayRef"
            class="camera-overlay"
            :style="cameraOverlayStyle"
          >
            <!-- Primero intentamos mostrar la publicación de cámara -->
            <ParticipantView
              v-if="localCameraPublication?.track"
              class="overlay-participant"
              :publication="localCameraPublication as TrackPublication | null"
              :is-local="true"
            />
            <!-- Si no hay publicación de cámara, usamos el preview local como fallback -->
            <video
              v-else
              ref="overlayPreviewRef"
              autoplay
              playsinline
              muted
              class="overlay-preview"
            ></video>
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
            @click="toggleCamera(!isCameraEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !isCameraEnabled }"
          >
            {{ isCameraEnabled ? '📷 Apagar' : '📷 Encender' }}
          </button>

          <button
            @click="toggleMicrophone(!isMicrophoneEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !isMicrophoneEnabled }"
          >
            {{ isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar' }}
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
            <button @click="toggleCameraOverlay(!isCameraOverlayEnabled)">
              {{ isCameraOverlayEnabled ? 'Overlay On' : 'Overlay Off' }}
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
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from 'vue'
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
  isPublishing,
  isStreamLive,
  isScreenSharing,
  isCameraFullScreen,
  isCameraOverlayEnabled,
  localParticipant,
  participantCount,
  availableCameras,
  availableMics,
  activeCameraId,
  activeMicId,
  cameraOverlayPosition,
  cameraOverlaySize,
  isCameraEnabled,
  isMicrophoneEnabled,
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
  toggleCameraOverlay,
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
const overlayPreviewRef = ref<HTMLVideoElement | null>(null)
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

// mainPublication igual que antes
const mainPublication = computed(() => {
  if (isScreenSharing.value && localScreenSharePublication.value) {
    if (isCameraFullScreen.value) {
      return localCameraPublication.value
    }
    return localScreenSharePublication.value
  }
  return localCameraPublication.value
})

const cameraOverlayStyle = computed(() => ({
  top: `${cameraOverlayPosition.value.y}%`,
  left: `${cameraOverlayPosition.value.x}%`,
  width: `${cameraOverlaySize.value.width}%`,
}))

/* ---------- preview local (para overlay fallback) ---------- */
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
    permissionError.value =
      'Permiso denegado para la cámara o el micrófono. Por favor, revisa la configuración de tu navegador.'
  } finally {
    isCheckingPermissions.value = false
  }
}

const disablePreview = () => {
  if (localVideoTrack.value) {
    try {
      localVideoTrack.value.stop()
      localVideoTrack.value.detach()
    } catch {}
    localVideoTrack.value = null
  }
}

/* ---------- overlay preview attach/detach logic ---------- */
async function attachOverlayPreview() {
  // Si no hay elemento de overlay, no hacemos nada
  if (!overlayPreviewRef.value) return

  try {
    // Si no tenemos preview local, intentamos crear uno *on demand*
    if (!localVideoTrack.value) {
      try {
        console.log('[overlay] creando preview local on-demand...')
        localVideoTrack.value = await createLocalVideoTrack({
          resolution: { width: 640, height: 360, frameRate: 15 },
        })
        // No adjuntamos el preview principal (previewVideoRef) para no interferir,
        // solo lo usaremos para el overlay.
      } catch (err) {
        console.warn('[overlay] fallo creando preview on-demand:', err)
        return
      }
    }

    // detach previos (best-effort)
    try { localVideoTrack.value?.detach(overlayPreviewRef.value) } catch {}
    // attach al elemento overlay
    localVideoTrack.value?.attach(overlayPreviewRef.value)

    // asegurar reproducción automática
    await nextTick()
    try { await overlayPreviewRef.value?.play().catch(()=>{}) } catch {}
    overlayPreviewRef.value.muted = true
    overlayPreviewRef.value.playsInline = true
    overlayPreviewRef.value.autoplay = true

    console.log('[overlay] preview attached')
  } catch (e) {
    console.warn('[overlay] attach failed', e)
  }
}


function detachOverlayPreview() {
  if (!overlayPreviewRef.value) return
  try {
    if (localVideoTrack.value) {
      try { localVideoTrack.value.detach(overlayPreviewRef.value) } catch {}
    }
    try { overlayPreviewRef.value.srcObject = null } catch {}
  } catch (e) {
    console.warn('[overlay] detach error', e)
  }
}


// Si la publicación de cámara llega (o se va), actualizamos el overlay:
watch(
  () => localCameraPublication?.value,
  async (newPub, oldPub) => {
    console.log('[overlay] cameraPublication changed:', {
      hasNew: !!newPub,
      newTrack: !!newPub?.track,
      isScreenSharing: isScreenSharing.value,
      isCameraEnabled: isCameraEnabled.value,
    })

    if (newPub && newPub.track) {
      detachOverlayPreview()
      return
    }

    if (!newPub?.track && isScreenSharing.value) {
      await attachOverlayPreview()
    } else {
      detachOverlayPreview()
    }
  },
  { immediate: true },
)


// También observamos el preview local por si se crea/destruye
watch(
  () => localVideoTrack.value,
  async (_t) => {
    if (!localCameraPublication?.value?.track && isScreenSharing.value && localVideoTrack.value) {
      await attachOverlayPreview()
    } else {
      detachOverlayPreview()
    }
  }
)

// preview enable on mount if needed
onMounted(() => {
  if (!room.value) {
    enablePreview()
  }
  // logs para diagnosticar
  console.log('[AdminStreamView] mount, isScreenSharing=', isScreenSharing.value)
})

onUnmounted(() => {
  detachOverlayPreview()
  disablePreview()
  if (room.value) {
    disconnect()
  }
})

/* ---------- restantes helpers (botones y selects) ---------- */
const handleConnectWithoutPublishing = async () => {
  if (!localVideoTrack.value) {
    alert('La cámara no está lista. Por favor, concede los permisos.')
    return
  }
  // No llamamos a disablePreview() aquí: conservamos el preview local
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

/* chat popup (igual que antes) */
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
</script>

<style scoped>
/* Todo el CSS previo (sin cambios relevantes) */
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
/* preview video fallback styling */
.overlay-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* espejo si es local */
  display: block;
  background: #000;
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
