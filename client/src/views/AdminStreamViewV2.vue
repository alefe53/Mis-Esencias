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
            :publication="cameraPublication" 
            :is-local="true" 
            class="main-video"
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
            <button disabled title="Próximamente">🖥️ Compartir</button>
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
// ❗️ CORRECCIÓN: Importamos nextTick
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useStreamingStoreV2 } from '../stores/streamingStoreV2';
import { useParticipantTracksV2 } from '../composables/streaming/useParticipantTracksV2';
import ParticipantViewV2 from '../components/streaming/ParticipantViewV2.vue'; 

const streamingStore = useStreamingStoreV2();
const { streamState, previewTrack, isActionPending, localParticipant } = storeToRefs(streamingStore);
const { getPermissionsAndPreview, enterStudio, leaveStudio, publishMedia, toggleCamera, toggleMicrophone } = streamingStore;

const previewVideoRef = ref<HTMLVideoElement | null>(null);

// ❗️ CORRECCIÓN: Obtenemos la función `updatePublications` del composable
const { cameraPublication, updatePublications } = useParticipantTracksV2(localParticipant);

// 🪵 LOG: Observando cambios clave
watch(localParticipant, (p) => console.log('[ADMIN-VIEW] 👂 Local participant changed:', p));
watch(cameraPublication, (pub) => console.log('[ADMIN-VIEW] 👂 Camera publication changed:', pub ? pub.trackSid : null));

// ❗️ CORRECCIÓN: Watcher para forzar la actualización de publicaciones
watch(() => streamState.value.isPublishing, async (newState, oldState) => {
  // 🪵 LOG: El estado de publicación ha cambiado
  console.log(`[ADMIN-VIEW] 👂 Publishing state changed from "${oldState}" to "${newState}"`);
  if (newState === 'active' && oldState === 'pending') {
    console.log('[ADMIN-VIEW] -> ✅ Publishing is active! Forcing publication update...');
    // Esperamos al siguiente ciclo del DOM para asegurar que LiveKit haya actualizado el estado interno
    await nextTick();
    updatePublications();
  }
});

watch([previewVideoRef, previewTrack], ([videoEl, track]) => {
  if (videoEl && track) {
    track.attach(videoEl);
  } else if (videoEl && !track) {
    const stream = videoEl.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
    }
  }
}, { immediate: true });

onMounted(() => {
  console.log('[ADMIN-VIEW] 🚀 Component mounted. Getting permissions...');
  getPermissionsAndPreview();
});

onUnmounted(() => {
  console.log('[ADMIN-VIEW] 🧹 Component unmounted. Leaving studio...');
  leaveStudio();
});
</script>

<style scoped>
/* (Tus estilos aquí, sin cambios) */
.admin-stream-layout { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(17, 24, 39, 0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; }
.stream-panel-full { width: 100%; max-width: 1280px; height: 95%; display: flex; flex-direction: column; background-color: #1f2937; border-radius: 8px; padding: 1rem; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.video-container { flex-grow: 1; background-color: black; border-radius: 6px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; min-height: 0; }
.preview-video, .main-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
.preview-video { transform: scaleX(-1); }
.main-video :deep(video) { transform: scaleX(-1); }
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