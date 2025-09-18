// RUTA: src/components/streaming/LiveStreamPlayer.vue

<template>
  <div class="livestream-player" @click="handleInteraction">
    <div class="main-video-area">
      <ParticipantViewV2
        v-if="mainPublication"
        :publication="mainPublication"
        :is-muted="isMuted"
      />
      <div v-else class="placeholder">
        <p>{{ statusMessage }}</p>
      </div>
    </div>

    <CameraOverlay
      v-if="showOverlay"
      :publication="cameraPublication"
      :position="layoutState.position"
      :size="layoutState.size"
    />
    
    <div v-if="mainPublication" class="controls-overlay">
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
import { ref, reactive, computed, onMounted, onUnmounted, shallowRef } from 'vue';
import { Room, RoomEvent, Track, ParticipantEvent, type RemoteParticipant, type TrackPublication } from 'livekit-client';
import ParticipantViewV2 from './ParticipantViewV2.vue';
import CameraOverlay from './CameraOverlay.vue';
import apiPublic from '../../services/apiPublic';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';

// --- Estado local del componente ---
const room = shallowRef<Room | null>(null);
const adminParticipant = shallowRef<RemoteParticipant | null>(null);
const cameraPublication = shallowRef<TrackPublication | null>(null);
const screenSharePublication = shallowRef<TrackPublication | null>(null);
const isMuted = ref(true);
const statusMessage = ref('Conectando a la transmisión...');

const layoutState = reactive({
  isScreenSharing: false,
  isCameraFocus: false,
  position: 'bottom-left' as OverlayPosition,
  size: 'md' as OverlaySize,
});

const textDecoder = new TextDecoder();

// --- Lógica de computadas para mostrar el video correcto ---
const mainPublication = computed(() => {
  if (layoutState.isCameraFocus) return cameraPublication.value;
  if (layoutState.isScreenSharing) return screenSharePublication.value;
  return cameraPublication.value;
});

const showOverlay = computed(() => {
  return layoutState.isScreenSharing && !layoutState.isCameraFocus && cameraPublication.value;
});

// --- Lógica de manejo de eventos de LiveKit (LA PARTE CLAVE) ---

// Usaremos un Map para guardar las funciones de callback y poder desuscribirnos correctamente.
const participantEventHandlers = new Map<string, { onTrackPublished: (pub: TrackPublication) => void; onTrackUnpublished: (pub: TrackPublication) => void }>();

/**
 * Esta función se encarga de "escuchar" los eventos de un participante específico.
 * La llamaremos para CADA participante que se conecte.
 */
function setupParticipantListeners(participant: RemoteParticipant) {
  if (participantEventHandlers.has(participant.sid)) {
    console.warn(`[LiveStreamPlayer] Ya se estaban escuchando eventos para ${participant.identity}. Omitiendo.`);
    return;
  }

  const onTrackPublished = (publication: TrackPublication) => {
    console.log(`[LiveStreamPlayer] 📢 Track publicado por ${participant.identity}:`, publication.source);
    // Si es un track de video, consideramos a este participante como el admin.
    if (publication.source === Track.Source.Camera || publication.source === Track.Source.ScreenShare) {
      if (!adminParticipant.value) {
        adminParticipant.value = participant;
        console.log(`[LiveStreamPlayer] ✅ Admin asignado: ${participant.identity}`);
      }
    }
    
    // Actualizamos nuestras referencias locales para que Vue reaccione.
    if (publication.source === Track.Source.Camera) {
      cameraPublication.value = publication;
    }
    if (publication.source === Track.Source.ScreenShare) {
      screenSharePublication.value = publication;
    }
  };

  const onTrackUnpublished = (publication: TrackPublication) => {
    console.log(`[LiveStreamPlayer] 📢 Track quitado por ${participant.identity}:`, publication.source);
    if (publication.source === Track.Source.Camera) {
      cameraPublication.value = null;
    }
    if (publication.source === Track.Source.ScreenShare) {
      screenSharePublication.value = null;
    }
  };

  // Guardamos las funciones para poder removerlas después.
  participantEventHandlers.set(participant.sid, { onTrackPublished, onTrackUnpublished });

  // Nos suscribimos a los eventos del participante.
  participant.on(ParticipantEvent.TrackPublished, onTrackPublished);
  participant.on(ParticipantEvent.TrackUnpublished, onTrackUnpublished);

  // También revisamos los tracks que ya pueda tener publicados.
  participant.getTrackPublications().forEach(pub => onTrackPublished(pub));
}

/**
 * Limpia los listeners de un participante para evitar fugas de memoria.
 */
function cleanupParticipantListeners(participant: RemoteParticipant) {
  const handlers = participantEventHandlers.get(participant.sid);
  if (handlers) {
    participant.off(ParticipantEvent.TrackPublished, handlers.onTrackPublished);
    participant.off(ParticipantEvent.TrackUnpublished, handlers.onTrackUnpublished);
    participantEventHandlers.delete(participant.sid);
    console.log(`[LiveStreamPlayer] 🧹 Listeners limpiados para ${participant.identity}`);
  }
}


onMounted(async () => {
  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  newRoom
    // Cuando ALGUIEN se conecta, empezamos a escuchar sus eventos.
    .on(RoomEvent.ParticipantConnected, setupParticipantListeners)
    // Cuando alguien se va, dejamos de escucharlo y limpiamos.
    .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      if (adminParticipant.value?.sid === participant.sid) {
        adminParticipant.value = null;
        cameraPublication.value = null;
        screenSharePublication.value = null;
        console.log(`[LiveStreamPlayer] 🛑 El admin ${participant.identity} se ha desconectado.`);
      }
      cleanupParticipantListeners(participant);
    })
    // El receptor de datos ahora es más simple y robusto.
    .on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const data = JSON.parse(textDecoder.decode(payload));
        console.log(`[LiveStreamPlayer] 📡 Datos de layout recibidos de ${participant?.identity}:`, data);
        
        // Asignamos directamente, sin condiciones. Asumimos que solo el admin envía esto.
        Object.assign(layoutState, data);
        
        // Si por alguna razón no teníamos al admin, el que envía datos es un buen candidato.
        if (!adminParticipant.value && participant) {
          adminParticipant.value = participant as RemoteParticipant;
          console.log(`[LiveStreamPlayer] ✅ Admin asignado por Data Channel: ${participant.identity}`);
        }
      } catch (e) {
        console.error('[LiveStreamPlayer] ❌ Error procesando datos recibidos:', e);
      }
    })
    .on(RoomEvent.Disconnected, () => {
      statusMessage.value = 'La transmisión ha finalizado.';
      cameraPublication.value = null;
      screenSharePublication.value = null;
      room.value = null;
    });

  try {
    const response = await apiPublic.get('/streaming/token?viewer=true');
    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
    
    console.log('[LiveStreamPlayer] ✅ Conectado a la sala.');
    room.value = newRoom;
    statusMessage.value = 'Conexión exitosa. Esperando al anfitrión...';

    // MUY IMPORTANTE: Escuchamos a los participantes que YA ESTABAN en la sala cuando nos conectamos.
    newRoom.remoteParticipants.forEach(setupParticipantListeners);

  } catch (error) {
    console.error('[LiveStreamPlayer] ❌ Error al conectar:', error);
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => {
  if (room.value) {
    // Limpiamos todos los listeners antes de desconectar
    room.value.remoteParticipants.forEach(cleanupParticipantListeners);
    room.value.disconnect();
    console.log('[LiveStreamPlayer] 🚪 Desconectado y listeners limpiados.');
  }
});

// --- Manejadores de interacción del usuario ---
const toggleMute = () => isMuted.value = !isMuted.value;
const handleInteraction = () => { if (isMuted.value) isMuted.value = false; };

</script>

<style scoped>
/* Tus estilos están perfectos, no necesitan cambios. */
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