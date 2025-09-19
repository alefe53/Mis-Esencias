<template>
  <div class="livestream-player" @click="handleInteraction" ref="playerContainerRef"> 
    <div class="main-video-area">
      <ParticipantViewV2
        v-if="mainViewPublication"
        :publication="mainViewPublication"
        :is-muted="isMuted"
      />
      <div v-else class="placeholder">
        <p>{{ statusMessage }}</p>
      </div>
    </div>

    <CameraOverlay
      v-if="showOverlay"
      :publication="overlayViewPublication"
      :position="layoutState.position"
      :size="layoutState.size"
    />
    
    <div v-if="mainViewPublication" class="controls-overlay">
      <div class="status-indicator">
        <span class="live-dot"></span> EN VIVO
      </div>
      <div class="right-controls">
        <button @click.stop="toggleMute" class="control-button">
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button @click.stop="toggleFullscreen" class="control-button">
          {{ isFullscreen ? '⤡' : '⤢' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, shallowRef, computed } from 'vue';
import { Room, RoomEvent, type RemoteParticipant, type TrackPublication } from 'livekit-client';
import { useRemoteParticipantTracks } from '../../composables/streaming/useRemoteParticipantTracks';
import { useStreamLayout } from '../../composables/streaming/useStreamLayout';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';
import ParticipantViewV2 from './ParticipantViewV2.vue';
import CameraOverlay from './CameraOverlay.vue';
import apiPublic from '../../services/apiPublic';

// --- Lógica de pantalla completa (sin cambios) ---
const playerContainerRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const updateFullscreenState = () => { isFullscreen.value = !!document.fullscreenElement; };
const toggleFullscreen = () => { if (!playerContainerRef.value) return; if (!document.fullscreenElement) { playerContainerRef.value.requestFullscreen(); } else { document.exitFullscreen(); } };
// ---

const room = shallowRef<Room | null>(null);
const adminParticipant = shallowRef<RemoteParticipant | null>(null);
const isMuted = ref(true);
const statusMessage = ref('Conectando a la transmisión...');

const { cameraPublication, screenSharePublication } = useRemoteParticipantTracks(adminParticipant);

// ▼▼▼ CAMBIO 1: El estado reactivo ya NO INCLUYE isScreenSharing ▼▼▼
const layoutState = reactive({
  // isScreenSharing: false, // ELIMINADO
  isCameraFocus: false,
  isCameraEnabled: false,
  position: 'bottom-left' as OverlayPosition,
  size: 'md' as OverlaySize,
});

// ▼▼▼ CAMBIO 2: La nueva y ÚNICA fuente de verdad para isScreenSharing ▼▼▼
// Esta propiedad computada es true ÚNICAMENTE si la publicación de la pantalla existe.
// Es la verdad absoluta del SDK de LiveKit.
const isScreenSharingFromTrack = computed(() => !!screenSharePublication.value);

// ▼▼▼ CAMBIO 3: Pasamos la nueva fuente de verdad al composable del layout ▼▼▼
const layoutStateRef = computed(() => {
  console.log(`[LiveStreamPlayer] -> 💡 Estado para layout: isScreenSharing=${isScreenSharingFromTrack.value}, isCameraFocus=${layoutState.isCameraFocus}`);
  return {
    isScreenSharing: isScreenSharingFromTrack.value, // Usamos nuestra nueva propiedad computada
    isCameraFocus: layoutState.isCameraFocus,
  }
});

const { mainViewPublication, overlayViewPublication, showOverlay } = useStreamLayout(
  layoutStateRef,
  { camera: cameraPublication, screen: screenSharePublication }
);

const textDecoder = new TextDecoder();

onMounted(async () => {
  document.addEventListener('fullscreenchange', updateFullscreenState);

  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  newRoom
    .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      if (!adminParticipant.value) {
        adminParticipant.value = participant;
      }
    })
    .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      if (adminParticipant.value?.sid === participant.sid) {
        adminParticipant.value = null;
      }
    })
    // ▼▼▼ CAMBIO 4: El handler ya NO actualiza layoutState.isScreenSharing ▼▼▼
    .on(RoomEvent.DataReceived, (payload) => {
        try {
            const raw = textDecoder.decode(payload as Uint8Array);
            const data = JSON.parse(raw);
            console.debug('[LiveStreamPlayer] <- DataReceived:', data);
            
            // if (typeof data.isScreenSharing === 'boolean') layoutState.isScreenSharing = data.isScreenSharing; // ELIMINADO
            
            // Seguimos usando el DataChannel para lo que sí es bueno: estados de UI que NO dependen de un track
            if (typeof data.isCameraFocus === 'boolean') layoutState.isCameraFocus = data.isCameraFocus;
            if (typeof data.position === 'string') layoutState.position = data.position;
            if (typeof data.size === 'string') layoutState.size = data.size;
        } catch (e) {}
    });

  try {
    const response = await apiPublic.get('/streaming/token?viewer=true');
    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
    
    room.value = newRoom;
    statusMessage.value = 'Conexión exitosa. Esperando al anfitrión...';

    // El request_layout sigue siendo una buena práctica para la sincronización inicial de los estados de UI
    try {
      const req = { type: 'request_layout' };
      const data = new TextEncoder().encode(JSON.stringify(req));
      newRoom.localParticipant.publishData(data, { reliable: true });
    } catch(e) {}

    if (newRoom.remoteParticipants.size > 0 && !adminParticipant.value) {
        const [firstParticipant] = newRoom.remoteParticipants.values();
        adminParticipant.value = firstParticipant;
    }

  } catch (error) {
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState);
  if (room.value) {
    room.value.disconnect();
  }
});

const toggleMute = () => isMuted.value = !isMuted.value;
const handleInteraction = () => { if (isMuted.value) isMuted.value = false; };
</script>

<style scoped>
/* Los estilos no cambian */
.livestream-player { width: 100%; height: 100%; background-color: #000; position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; }
.main-video-area { width: 100%; height: 100%; }
.placeholder { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: #a0a0a0; font-size: 1.2rem; }
.controls-overlay { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
.livestream-player:hover .controls-overlay { opacity: 1; }
.controls-overlay > * { pointer-events: auto; }
.status-indicator { color: white; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; background-color: rgba(0,0,0,0.5); padding: 0.3rem 0.7rem; border-radius: 15px; }
.live-dot { width: 10px; height: 10px; background-color: #e53e3e; border-radius: 50%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { transform: scale(0.9); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); } 100% { transform: scale(0.9); } }
.right-controls { display: flex; gap: 0.5rem; }
.control-button { background-color: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; padding: 0.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; font-weight: 500; transition: background-color 0.2s; }
.control-button:hover { background-color: rgba(255, 255, 255, 0.4); }
</style>