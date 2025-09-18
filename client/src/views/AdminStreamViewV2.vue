<template>
  <div class="admin-stream-layout">
    <div class="stream-panel-full">
      <div class="video-container">
        <template v-if="!localParticipant">
          <video ref="previewVideoRef" autoplay muted playsinline class="preview-video"></video>
          <div class="placeholder-content">
            <p v-if="streamState.permissionError">{{ streamState.permissionError }}</p>
            <p v-else-if="!previewTrack">Solicitando permisos...</p>
            <p v-else>Cámara lista.</p>
            <button @click="enterStudio" :disabled="streamState.isConnecting || !previewTrack">
              {{ streamState.isConnecting ? 'Entrando...' : '▶️ Entrar al Studio' }}
            </button>
          </div>
        </template>
        
        <template v-else>
          <video 
            v-if="streamState.isPublishing !== 'active'" 
            ref="mainStudioVideoRef" 
            autoplay 
            muted 
            playsinline 
            class="main-video"
          ></video>
          
          <ParticipantViewV2 
            v-else
            :publication="localCameraPublication"
            :is-local="true"
            class="main-video"
          />

          <div v-if="streamState.isPublishing === 'active' && !streamState.isCameraEnabled" class="no-video-placeholder">
            Cámara Apagada
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
            🚀 Publicar Media
          </button>
          
          <template v-else>
            <button @click="toggleCamera" :class="{ 'is-off': !streamState.isCameraEnabled }" :disabled="isProcessing">
              {{ streamState.isCameraEnabled ? '📷 Apagar Cámara' : '📷 Encender Cámara' }}
            </button>
            <button @click="toggleMicrophone" :class="{ 'is-off': !streamState.isMicrophoneEnabled }" :disabled="isProcessing">
              {{ streamState.isMicrophoneEnabled ? '🎤 Silenciar' : '🎤 Activar Mic' }}
            </button>
            <button disabled title="Próximamente">🖥️ Compartir</button>
          </template>
        </div>
        
        <div class="stream-actions">
          <button @click="leaveStudio()" class="disconnect-btn">
            🚪 Salir del Studio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStoreV2 } from '../stores/streamingStoreV2';
import ParticipantViewV2 from '../components/streaming/ParticipantViewV2.vue';
import { useParticipantTracksV2 } from '../composables/streaming/useParticipantTracksV2';

const streamingStore = useStreamingStoreV2();

const { streamState } = streamingStore; 
const { previewTrack, isProcessing, localParticipant } = storeToRefs(streamingStore);
const { getPermissionsAndPreview, enterStudio, leaveStudio, publishMedia, toggleCamera, toggleMicrophone } = streamingStore;

const { cameraPublication: localCameraPublication } = useParticipantTracksV2(localParticipant);

const previewVideoRef = ref<HTMLVideoElement | null>(null);
const mainStudioVideoRef = ref<HTMLVideoElement | null>(null); // Ref para el video principal

// Este watch se encarga de adjuntar el track a CUALQUIER elemento de video que esté visible
watch(previewTrack, (track) => {
  if (track) {
    // Intenta adjuntar a ambos. Solo funcionará en el que esté montado en el DOM.
    if (previewVideoRef.value) track.attach(previewVideoRef.value);
    if (mainStudioVideoRef.value) track.attach(mainStudioVideoRef.value);
  }
});

// Watcher adicional para cuando el video del studio principal APARECE
watch(mainStudioVideoRef, (videoEl) => {
    if (videoEl && previewTrack.value) {
        previewTrack.value.attach(videoEl);
    }
});


onMounted(() => {
  getPermissionsAndPreview();
});

onUnmounted(() => {
  leaveStudio();
});
</script>

<style scoped>

/* Copia y pega aquí los estilos de tu AdminStreamView.vue original */
.admin-stream-layout { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(17, 24, 39, 0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
.stream-panel-full { width: 100%; max-width: 1280px; height: 95%; display: flex; flex-direction: column; background-color: #1f2937; border-radius: 8px; padding: 1rem; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.video-container { flex-grow: 1; background-color: black; border-radius: 6px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; min-height: 0; }
.preview-video, .main-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
.preview-video, video[ref="mainStudioVideoRef"] { transform: scaleX(-1); } /* Solo espeja la preview y el video local del studio */

.no-video-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #d1d5db; font-size: 1.5rem; background-color: #111827; z-index: 2; }
.placeholder-content { position: relative; z-index: 2; background-color: rgba(0, 0, 0, 0.6); padding: 1rem 2rem; border-radius: 8px; color: white; text-align: center; }
.placeholder-content button { margin-top: 1rem; background-color: #2563eb; color: white; font-weight: bold; border-radius: 8px; padding: 0.6em 1.2em; font-size: 1em; cursor: pointer; border: none;}
.controls-section { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid #374151; }
.device-controls, .stream-actions { display: flex; gap: 0.75rem; align-items: center; }
.device-controls button, .stream-actions button { background-color: #4b5563; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
.device-controls button:hover, .stream-actions button:hover { background-color: #6b7280; }
.device-controls button.is-off { background-color: #be123c; }
.start-publish-btn { background-color: #1d4ed8 !important; }
.disconnect-btn { background-color: #991b1b !important; }
button:disabled { background-color: #374151 !important; cursor: not-allowed; opacity: 0.7; }
</style>