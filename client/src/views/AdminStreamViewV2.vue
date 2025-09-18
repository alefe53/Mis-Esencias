<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container">
        <template v-if="!localParticipant">
          <video ref="previewVideoRef" autoplay muted playsinline class="preview-video"></video>
          <div class="placeholder-content">
            <p v-if="streamState.permissionError">{{ streamState.permissionError }}</p>
            <p v-else-if="!previewTrack">Solicitando permisos de cámara...</p>
            <p v-else>Cámara lista para la vista previa.</p>
            <button @click="enterStudio" :disabled="streamState.isConnecting || !previewTrack || !!streamState.permissionError">
              {{ streamState.isConnecting ? 'Entrando...' : '▶️ Entrar al Studio' }}
            </button>
          </div>
        </template>
        
        <template v-else>
          <ParticipantViewV2 
            v-if="!streamState.isScreenSharing"
            :publication="cameraPublication" 
            :is-local="true" 
            class="main-video"
          />

          <ParticipantViewV2 
            v-if="streamState.isScreenSharing"
            :publication="screenSharePublication" 
            :is-local="false" 
            class="main-video"
          />
          
          <CameraOverlay 
            v-if="streamState.isScreenSharing && cameraPublication"
            :publication="cameraPublication"
          />

          <div v-if="!cameraPublication" class="no-video-placeholder">
            📷 Cámara Apagada
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
           {{ streamState.isPublishing === 'pending' ? 'Publicando...' : '🚀 Publicar Media' }}
          </button>
          
          <template v-else>
            <button @click="toggleCamera" :class="{ 'is-off': !streamState.isCameraEnabled }" :disabled="isActionPending">
              {{ streamState.isCameraEnabled ? '📷 Apagar Cámara' : '📷 Encender Cámara' }}
            </button>
            <button @click="toggleMicrophone" :class="{ 'is-off': !streamState.isMicrophoneEnabled }" :disabled="isActionPending">
              {{ streamState.isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar Mic' }}
            </button>
            <button 
              @click="toggleScreenShare" 
              :class="{ 'is-sharing': streamState.isScreenSharing }" 
              :disabled="isActionPending"
            >
              {{ streamState.isScreenSharing ? '🖥️ Dejar de Compartir' : '🖥️ Compartir' }}
            </button>
          </template>
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
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStoreV2 } from '../stores/streamingStoreV2';
import { useParticipantTracksV2 } from '../composables/streaming/useParticipantTracksV2';
import ParticipantViewV2 from '../components/streaming/ParticipantViewV2.vue';
import CameraOverlay from '../components/streaming/CameraOverlay.vue';

const streamingStore = useStreamingStoreV2();
const { streamState, previewTrack, isActionPending, localParticipant } = storeToRefs(streamingStore);
const { getPermissionsAndPreview, enterStudio, leaveStudio, publishMedia, toggleCamera, toggleMicrophone, toggleScreenShare } = streamingStore;

const previewVideoRef = ref<HTMLVideoElement | null>(null);

const { cameraPublication, screenSharePublication } = useParticipantTracksV2(localParticipant);

watch(cameraPublication, (pub) => console.log('[ADMIN-VIEW] 👂 Camera publication changed:', pub ? pub.trackSid : null));
watch(screenSharePublication, (pub) => console.log('[ADMIN-VIEW] 👂 ScreenShare publication changed:', pub ? pub.trackSid : null));

watch([previewVideoRef, previewTrack], ([videoEl, track]) => {
  if (videoEl && track) { track.attach(videoEl); } 
  else if (videoEl && !track) {
    const stream = videoEl.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
    }
  }
}, { immediate: true });

onMounted(() => {
  console.log('[ADMIN-VIEW] 🚀 Component mounted.');
  getPermissionsAndPreview();
});

onUnmounted(() => {
  console.log('[ADMIN-VIEW] 🧹 Component unmounted.');
  leaveStudio();
});
</script>

<style scoped>
.admin-stream-layout { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(17, 24, 39, 0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
.stream-panel-full { width: 100%; max-width: 1280px; height: 95%; display: flex; flex-direction: column; background-color: #1f2937; border-radius: 8px; padding: 1rem; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.video-container { flex-grow: 1; background-color: black; border-radius: 6px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; min-height: 0; }
.preview-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
.main-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.no-video-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #d1d5db; font-size: 1.5rem; background-color: #111827; z-index: 2; }
.placeholder-content { position: relative; z-index: 2; background-color: rgba(0, 0, 0, 0.6); padding: 1rem 2rem; border-radius: 8px; color: white; text-align: center; }
.placeholder-content button { margin-top: 1rem; background-color: #2563eb; color: white; font-weight: bold; border-radius: 8px; padding: 0.6em 1.2em; font-size: 1em; cursor: pointer; border: none;}
.controls-section { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid #374151; }
.device-controls, .stream-actions { display: flex; gap: 0.75rem; align-items: center; }
.device-controls button, .stream-actions button { background-color: #4b5563; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.device-controls button:hover, .stream-actions button:hover { background-color: #6b7280; }
.device-controls button.is-off { background-color: #be123c; }
.start-publish-btn { background-color: #1d4ed8 !important; }
.disconnect-btn { background-color: #991b1b !important; }
button:disabled { background-color: #374151 !important; cursor: not-allowed; opacity: 0.7; }
.device-controls button.is-sharing { background-color: #059669; box-shadow: 0 0 8px #10b981; }
.main-video :deep(video) { object-fit: contain; }
</style>