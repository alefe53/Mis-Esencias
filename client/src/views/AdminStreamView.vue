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
            v-if="!isPublishing"
            @click="startPublishing"
            class="start-publish-btn"
          >
            🚀 Publicar Media
          </button>
          
          <template v-else>
            <button
              @click="toggleCameraOverlay(!isCameraOverlayEnabled)"
              :class="{ 'is-off': !isCameraOverlayEnabled }"
              title="Muestra u oculta tu cámara en el overlay (solo para ti)"
            >
              {{ isCameraOverlayEnabled ? '📷 Ocultar' : '📷 Mostrar' }}
            </button>

            <button
              @click="publishCameraAction"
              :disabled="isCameraTogglePending"
              :class="{ 'is-off': !isCameraEnabled }"
              title="Publica o deja de publicar tu cámara para los espectadores"
            >
              {{ isCameraEnabled ? '📡 Dejar de Publicar' : '📡 Publicar Cámara' }}
            </button>
            <button
              @click="toggleMicrophone(!isMicrophoneEnabled)"
              :class="{ 'is-off': !isMicrophoneEnabled }"
            >
              {{ isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar' }}
            </button>
             <button
              @click="toggleScreenShare"
              :class="{ 'is-sharing': isScreenSharing }"
            >
              {{ isScreenSharing ? '🖥️ Dejar de Compartir' : '🖥️ Compartir' }}
            </button>
          </template>
        </div>
        
        <div class="stream-actions">
           <button v-if="isPublishing" @click="stopPublishing" class="pause-stream-btn">
            ⏸️ Parar Publicación
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

// --- Watcher para el Overlay ---
watch(
  overlayVideoRef,
  (videoEl) => {
    if (videoEl && isScreenSharing.value && localVideoTrack.value) {
      localVideoTrack.value.attach(videoEl);
    }
  },
  { flush: 'post' }
);

// --- Ciclo de Vida del Componente ---
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
/* ...el resto de tu CSS */
.start-publish-btn, .pause-stream-btn {
  background-color: #1d4ed8;
  padding: 0.6rem 1.2rem;
  font-weight: bold;
}
.pause-stream-btn {
  background-color: #d97706;
}
</style>