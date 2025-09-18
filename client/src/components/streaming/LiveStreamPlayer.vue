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
import { ref, reactive, computed, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import { Room, RoomEvent, Track, DataPacket_Kind, type RemoteParticipant, type TrackPublication } from 'livekit-client';
import ParticipantViewV2 from './ParticipantViewV2.vue';
import CameraOverlay from './CameraOverlay.vue'; // Reutilizamos el overlay
import apiPublic from '../../services/apiPublic';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';

// Estado local del reproductor
const room = shallowRef<Room | null>(null);
const adminParticipant = shallowRef<RemoteParticipant | null>(null);
const cameraPublication = shallowRef<TrackPublication | null>(null);
const screenSharePublication = shallowRef<TrackPublication | null>(null);
const isMuted = ref(true); // Empezamos en silencio para cumplir la política de autoplay
const statusMessage = ref('Conectando a la transmisión...');

// Estado del layout que recibimos del admin
const layoutState = reactive({
  isScreenSharing: false,
  isCameraFocus: false,
  position: 'bottom-left' as OverlayPosition,
  size: 'md' as OverlaySize,
});

// Lógica para decidir qué se muestra
const mainPublication = computed(() => {
  if (layoutState.isCameraFocus) return cameraPublication.value;
  if (layoutState.isScreenSharing) return screenSharePublication.value;
  return cameraPublication.value;
});

const showOverlay = computed(() => {
  return layoutState.isScreenSharing && !layoutState.isCameraFocus && cameraPublication.value;
});

const textDecoder = new TextDecoder();

const updateAdminState = (r: Room) => {
  for (const p of r.remoteParticipants.values()) {
    // Asumimos que el admin es el único que puede publicar
    if (p.isCameraEnabled) {
      console.log(`[LiveStreamPlayer] ✅ Admin encontrado: ${p.identity}`);
      adminParticipant.value = p;
      cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
      screenSharePublication.value = p.getTrackPublication(Track.Source.ScreenShare) ?? null;

      // Nos suscribimos a los eventos de este participante
      p.on(RoomEvent.TrackPublished, pub => {
        if (pub.source === Track.Source.Camera) cameraPublication.value = pub;
        if (pub.source === Track.Source.ScreenShare) screenSharePublication.value = pub;
      });
      p.on(RoomEvent.TrackUnpublished, pub => {
        if (pub.source === Track.Source.Camera) cameraPublication.value = null;
        if (pub.source === Track.Source.ScreenShare) screenSharePublication.value = null;
      });
      
      return;
    }
  }
  // Si no encontramos a nadie, reseteamos
  adminParticipant.value = null;
};

onMounted(async () => {
  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  newRoom
    .on(RoomEvent.ParticipantConnected, () => updateAdminState(newRoom))
    .on(RoomEvent.ParticipantDisconnected, () => updateAdminState(newRoom))
    .on(RoomEvent.DataReceived, (payload, participant) => {
      // ¡AQUÍ ESTÁ LA MAGIA DE LA SINCRONIZACIÓN!
      if (participant?.identity === adminParticipant.value?.identity) {
        const data = JSON.parse(textDecoder.decode(payload));
        console.log('📢 [LiveStreamPlayer] Datos de layout recibidos:', data);
        Object.assign(layoutState, data); // Actualizamos nuestro estado local con lo que mandó el admin
      }
    })
    .on(RoomEvent.Disconnected, () => {
      statusMessage.value = 'La transmisión ha finalizado.';
      cameraPublication.value = null;
      screenSharePublication.value = null;
    });

  try {
    const response = await apiPublic.get('/streaming/token?viewer=true');
    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
    console.log('[LiveStreamPlayer] ✅ Conectado a la sala.');
    statusMessage.value = 'Conexión exitosa. Esperando al anfitrión...';
    updateAdminState(newRoom);
    room.value = newRoom;
  } catch (error) {
    console.error('[LiveStreamPlayer] ❌ Error al conectar:', error);
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => room.value?.disconnect());

const toggleMute = () => isMuted.value = !isMuted.value;
const handleInteraction = () => {
    // Si el usuario hace click en el video y está muteado, le quitamos el mute.
    if (isMuted.value) isMuted.value = false;
};
</script>

<style scoped>
/* (Copia aquí los estilos del LiveStreamPlayer que propusiste, son excelentes) */
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