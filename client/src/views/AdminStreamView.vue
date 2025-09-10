<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container">
        <template v-if="room">
          <ParticipantView
            :publication="mainPublication"
            :is-local="true"
            class="main-video"
            :class="{ 'fill-container': !isScreenSharing || isCameraFullScreen }"
          />
          <div
            v-if="!isCameraFullScreen && isScreenSharing && isCameraOverlayEnabled"
            class="camera-overlay"
          >
            <video
              ref="overlayVideoRef"
              autoplay
              playsinline
              muted
              class="overlay-video"
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
            <p v-else>Cámara lista para la vista previa.</p>
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
            @click="toggleCameraOverlay(!isCameraOverlayEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !isCameraOverlayEnabled }"
            title="Muestra u oculta tu cámara en el overlay (solo para ti)"
          >
            {{ isCameraOverlayEnabled ? '📷 Ocultar' : '📷 Mostrar' }}
          </button>

          <button
            @click="publishCameraAction"
            :disabled="!isPublishing || isCameraTogglePending"
            :class="{ 'is-off': !isCameraEnabled }"
            title="Publica o deja de publicar tu cámara para los espectadores"
          >
            {{ isCameraEnabled ? '📡 Dejar de Publicar' : '📡 Publicar Cámara' }}
          </button>
           <button
            @click="toggleMicrophone(!isMicrophoneEnabled)"
            :disabled="!isPublishing"
            :class="{ 'is-off': !isMicrophoneEnabled }"
          >
            {{ isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar' }}
          </button>
        </div>
        
        <div class="stream-actions">
           <button
            @click="toggleScreenShare"
            :class="{ 'is-sharing': isScreenSharing }"
            :disabled="!isPublishing"
          >
            {{ isScreenSharing ? '🖥️ Dejar de Compartir' : '🖥️ Compartir' }}
          </button>
          <button @click="intentionallyDisconnect" class="disconnect-btn">
            🚪 Salir del Studio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStore } from '../stores/streamingStore';
import ParticipantView from '../components/streaming/ParticipantView.vue';
import { createLocalVideoTrack, type LocalVideoTrack, type TrackPublication } from 'livekit-client';
import { useParticipantTracks } from '../composables/useParticipantTracks';

const streamingStore = useStreamingStore();

const {
  room,
  isConnecting,
  isPublishing,
  isScreenSharing,
  isCameraFullScreen,
  isCameraOverlayEnabled,
  localParticipant,
  isCameraEnabled,
  isMicrophoneEnabled,
  isIntentionalDisconnect,
  isCameraTogglePending,
  cameraOverlayPosition,
  cameraOverlaySize
} = storeToRefs(streamingStore);

const {
  intentionallyDisconnect,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  toggleCameraOverlay,
  connectWithoutPublishing,
  startPublishing,
  stopPublishing,
} = streamingStore;

// --- Refs del Componente ---
const previewVideoRef = ref<HTMLVideoElement | null>(null);
const overlayVideoRef = ref<HTMLVideoElement | null>(null);
const localVideoTrack = ref<LocalVideoTrack | null>(null);
const permissionError = ref('');
const isCheckingPermissions = ref(true);

// --- Lógica de Publicaciones y UI ---
const {
  cameraTrackPub: localCameraPublication,
  screenShareTrackPub: localScreenSharePublication,
} = useParticipantTracks(localParticipant);

const mainPublication = computed<TrackPublication | null>(() => {
  if (isScreenSharing.value && localScreenSharePublication.value) {
    return isCameraFullScreen.value ? localCameraPublication.value : localScreenSharePublication.value;
  }
  return localCameraPublication.value;
});

const cameraOverlayStyle = computed(() => ({
  top: `${cameraOverlayPosition.value.y}%`,
  left: `${cameraOverlayPosition.value.x}%`,
  width: `${cameraOverlaySize.value.width}%`,
}));

// --- Lógica de Acciones de la UI ---
const publishCameraAction = async () => {
  if (isCameraTogglePending.value) return;
  await toggleCamera(!isCameraEnabled.value);
};

const handleConnectWithoutPublishing = async () => {
  if (!localVideoTrack.value) return alert('La cámara no está lista.');
  await connectWithoutPublishing();
};

// --- Lógica de Video Local Persistente ---
const setupLocalVideo = async () => {
  if (localVideoTrack.value) return;
  isCheckingPermissions.value = true;
  permissionError.value = '';
  try {
    const track = await createLocalVideoTrack({
      resolution: { width: 1280, height: 720 },
    });
    localVideoTrack.value = track;
    if (previewVideoRef.value) {
      track.attach(previewVideoRef.value);
    }
  } catch (error) {
    permissionError.value = 'Permiso de cámara denegado. Revisa la configuración del navegador.';
  } finally {
    isCheckingPermissions.value = false;
  }
};

const cleanupLocalVideo = () => {
  if (localVideoTrack.value) {
    localVideoTrack.value.stop();
    localVideoTrack.value = null;
  }
};

// ✅ SOLUCIÓN AL ERROR: Watcher simple y seguro con tipos
watch(
  overlayVideoRef,
  (videoEl) => {
    // Si el elemento de video del overlay está disponible y estamos compartiendo pantalla
    // y tenemos nuestro track local, lo vinculamos.
    if (videoEl && isScreenSharing.value && localVideoTrack.value) {
      localVideoTrack.value.attach(videoEl);
    }
  },
  { flush: 'post' } // flush: 'post' espera a que el DOM esté actualizado
);

// --- Ciclo de Vida del Componente (CORREGIDO) ---
onMounted(() => {
  setupLocalVideo();
});

onUnmounted(() => {
  cleanupLocalVideo();

  if (room.value && !isIntentionalDisconnect.value) {
    console.warn("AdminStreamView se desmontó inesperadamente. DESCONEXIÓN EVITADA.");
    return;
  }
});
</script>

<style scoped>
/* Tu CSS existente... */
.camera-overlay {
  position: absolute;
  aspect-ratio: 16 / 9;
  border: 2px solid #4b5563;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}
.overlay-video { /* Estilo para el nuevo <video> del overlay */
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}
.preview-video {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  z-index: 1;
  transform: scaleX(-1);
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
