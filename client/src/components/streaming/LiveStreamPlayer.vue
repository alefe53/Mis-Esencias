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
// ✅ AÑADIDO: ParticipantEvent para una suscripción de eventos correcta
import { Room, RoomEvent, Track, ParticipantEvent, type RemoteParticipant, type TrackPublication } from 'livekit-client';
import ParticipantViewV2 from './ParticipantViewV2.vue';
import CameraOverlay from './CameraOverlay.vue';
import apiPublic from '../../services/apiPublic';
import type { OverlayPosition, OverlaySize } from '../../composables/streaming/useStreamStateV2';

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

const mainPublication = computed(() => {
  if (layoutState.isCameraFocus) return cameraPublication.value;
  if (layoutState.isScreenSharing) return screenSharePublication.value;
  return cameraPublication.value;
});

const showOverlay = computed(() => {
  return layoutState.isScreenSharing && !layoutState.isCameraFocus && cameraPublication.value;
});

const textDecoder = new TextDecoder();

// ✅ REEMPLAZADO: Lógica de detección de admin mejorada
const updateAdminParticipant = (r: Room) => {
  for (const p of r.remoteParticipants.values()) {
    const camPub = p.getTrackPublication(Track.Source.Camera);
    const screenPub = p.getTrackPublication(Track.Source.ScreenShare);

    // Si el participante tiene CUALQUIER track de video, es nuestro admin
    if (camPub || screenPub) {
      console.log(`[LiveStreamPlayer] ✅ Admin detectado: ${p.identity}`);
      adminParticipant.value = p;
      cameraPublication.value = camPub ?? null;
      screenSharePublication.value = screenPub ?? null;

      // Limpiamos listeners anteriores para evitar duplicados
      p.removeAllListeners(ParticipantEvent.TrackPublished);
      p.removeAllListeners(ParticipantEvent.TrackUnpublished);

      // Usamos ParticipantEvent, que es lo correcto para eventos de un participante específico
      p.on(ParticipantEvent.TrackPublished, pub => {
        console.log(`[LiveStreamPlayer] Admin publicó un track: ${pub.source}`);
        if (pub.source === Track.Source.Camera) cameraPublication.value = pub;
        if (pub.source === Track.Source.ScreenShare) screenSharePublication.value = pub;
      });
      p.on(ParticipantEvent.TrackUnpublished, pub => {
        console.log(`[LiveStreamPlayer] Admin dejó de publicar un track: ${pub.source}`);
        if (pub.source === Track.Source.Camera) cameraPublication.value = null;
        if (pub.source === Track.Source.ScreenShare) screenSharePublication.value = null;
      });
      
      return; // Salimos al encontrar al primer admin
    }
  }
  // Si el bucle termina y no encontramos a nadie publicando
  adminParticipant.value = null;
  cameraPublication.value = null;
  screenSharePublication.value = null;
};

onMounted(async () => {
  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  newRoom
    .on(RoomEvent.ParticipantConnected, () => updateAdminParticipant(newRoom))
    .on(RoomEvent.ParticipantDisconnected, () => updateAdminParticipant(newRoom))
    // ✅ REEMPLAZADO: Lógica de recepción de datos mejorada
    .on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const data = JSON.parse(textDecoder.decode(payload));
        // Asignamos al participante que envía datos como el admin si aún no lo tenemos
        if (!adminParticipant.value && participant) {
          adminParticipant.value = participant as RemoteParticipant;
          console.log(`[LiveStreamPlayer] ℹ️ Admin asignado por Data Channel: ${participant.identity}`);
        }
        // Procesamos los datos solo si vienen del admin que tenemos identificado
        if (participant?.identity === adminParticipant.value?.identity) {
          console.log('📢 [LiveStreamPlayer] Datos de layout recibidos:', data);
          Object.assign(layoutState, data);
        }
      } catch (e) {
        console.error('[LiveStreamPlayer] ❌ Error procesando datos recibidos:', e);
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
    updateAdminParticipant(newRoom);
    room.value = newRoom;
  } catch (error) {
    console.error('[LiveStreamPlayer] ❌ Error al conectar:', error);
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => room.value?.disconnect());

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