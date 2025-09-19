<template>
  <div class="livestream-player" @click="handleInteraction">
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
      <button @click.stop="toggleMute" class="mute-button">
        {{ isMuted ? '🔇 Activar Sonido' : '🔊 Silenciar' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, reactive, onMounted, onUnmounted, shallowRef, computed } from 'vue';
import { Room, RoomEvent, Track, type RemoteParticipant, type TrackPublication } from 'livekit-client';
import { useStreamLayout } from '../../composables/streaming/useStreamLayout';
// ▼▼▼ 1. IMPORTA EL NUEVO COMPOSABLE ▼▼▼
import { useRemoteParticipantTracks } from '../../composables/streaming/useRemoteParticipantTracks';
import ParticipantViewV2 from './ParticipantViewV2.vue';
import CameraOverlay from './CameraOverlay.vue';
import apiPublic from '../../services/apiPublic';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';

// --- El <template> y <style> se mantienen IGUAL ---

const room = shallowRef<Room | null>(null);
const adminParticipant = shallowRef<RemoteParticipant | null>(null);
const isMuted = ref(true);
const statusMessage = ref('Conectando a la transmisión...');

// ▼▼▼ 2. USA EL NUEVO COMPOSABLE ▼▼▼
// Él se encargará de mantener estas referencias actualizadas y reactivas.
const { cameraPublication, screenSharePublication } = useRemoteParticipantTracks(adminParticipant);

// El estado local que se sincroniza desde el admin vía DataChannel
const layoutState = reactive({
  isScreenSharing: false,
  isCameraFocus: false,
  isCameraEnabled: false,
  position: 'bottom-left' as OverlayPosition,
  size: 'md' as OverlaySize,
});

const layoutStateRef = computed(() => layoutState);

// ▼▼▼ 3. LA LÓGICA DE USESTREAMLAYOUT AHORA FUNCIONARÁ CORRECTAMENTE ▼▼▼
// Porque tanto `layoutStateRef` como las `publications` son completamente reactivas.
// Cualquier cambio en CUALQUIERA de ellas, recalculará la vista.
const { mainViewPublication, overlayViewPublication, showOverlay } = useStreamLayout(
  layoutStateRef,
  { camera: cameraPublication, screen: screenSharePublication }
);

const textDecoder = new TextDecoder();

// ▼▼▼ 4. ELIMINA TODA LA LÓGICA ANTIGUA ▼▼▼
// BORRA: participantEventHandlers
// BORRA: setupParticipantListeners
// BORRA: cleanupParticipantListeners

onMounted(async () => {
  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  newRoom
    .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      // Asumimos que el primer participante que se conecta es el admin.
      // Si esta lógica es más compleja, se puede ajustar aquí.
      if (!adminParticipant.value) {
        adminParticipant.value = participant;
      }
    })
    .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      if (adminParticipant.value?.sid === participant.sid) {
        adminParticipant.value = null; // Esto limpiará los tracks automáticamente gracias al composable.
      }
    })
    .on(RoomEvent.DataReceived, (payload) => {
        try {
            const raw = textDecoder.decode(payload as Uint8Array);
            const data = JSON.parse(raw);

            console.log('[LiveStreamPlayer] <- 📩 DataReceived:', data);

            // Asignación segura y explícita
            if (typeof data.isScreenSharing === 'boolean') layoutState.isScreenSharing = data.isScreenSharing;
            if (typeof data.isCameraFocus === 'boolean') layoutState.isCameraFocus = data.isCameraFocus;
            if (typeof data.isCameraEnabled === 'boolean') layoutState.isCameraEnabled = data.isCameraEnabled;
            if (typeof data.position === 'string') layoutState.position = data.position;
            if (typeof data.size === 'string') layoutState.size = data.size;
            
        } catch (e) {
            console.error('[LiveStreamPlayer] ❌ Error procesando DataReceived:', e, 'payload:', payload);
        }
    })

  try {
    const response = await apiPublic.get('/streaming/token?viewer=true');
    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
    
    room.value = newRoom;
    statusMessage.value = 'Conexión exitosa. Esperando al anfitrión...';

    // Si ya hay participantes al conectar, busca al admin
    if (newRoom.remoteParticipants.size > 0 && !adminParticipant.value) {
        // Esta es una forma simple, podrías tener una lógica más robusta
        // para identificar al admin si es necesario.
        const [firstParticipant] = newRoom.remoteParticipants.values();
        adminParticipant.value = firstParticipant;
    }

  } catch (error) {
    console.error('[LiveStreamPlayer] ❌ Error al conectar:', error);
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => {
  if (room.value) {
    room.value.disconnect();
  }
});

const toggleMute = () => isMuted.value = !isMuted.value;
const handleInteraction = () => { if (isMuted.value) isMuted.value = false; };
</script>

<style scoped>
.livestream-player { width: 100%; height: 100%; background-color: #000; position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; }
.main-video-area { width: 100%; height: 100%; }
.placeholder { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: #a0a0a0; font-size: 1.2rem; }
.controls-overlay { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
.livestream-player:hover .controls-overlay { opacity: 1; }
.controls-overlay > * { pointer-events: auto; }
.status-indicator { color: white; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; background-color: rgba(0,0,0,0.5); padding: 0.3rem 0.7rem; border-radius: 15px; }
.live-dot { width: 10px; height: 10px; background-color: #e53e3e; border-radius: 50%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); } 100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); } }
.mute-button { background-color: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; padding: 0.5rem 1rem; cursor: pointer; font-weight: 500; transition: background-color 0.2s; }
.mute-button:hover { background-color: rgba(255, 255, 255, 0.4); }
</style>