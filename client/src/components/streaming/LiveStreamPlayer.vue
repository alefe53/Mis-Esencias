<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, shallowRef } from 'vue';
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

// Map para guardar handlers por participante para poder hacer off() luego
const participantHandlers = new Map<RemoteParticipant, { onPublished: any, onUnpublished: any }>();

// Handler cuando un participante publica/unpublica track: lo marca admin si es video
function attachParticipantListeners(p: RemoteParticipant) {
  if (participantHandlers.has(p)) return;

  const onPublished = (pub: TrackPublication) => {
    try {
      console.log(`[LiveStreamPlayer] Participant ${p.identity} published:`, pub.source);
      if (pub.source === Track.Source.Camera) {
        adminParticipant.value = p;
        cameraPublication.value = pub;
      }
      if (pub.source === Track.Source.ScreenShare) {
        adminParticipant.value = p;
        screenSharePublication.value = pub;
      }
      // en cualquier caso logueamos para debugging
      console.log('[LiveStreamPlayer] → after publish, cameraPub:', !!cameraPublication.value, 'screenPub:', !!screenSharePublication.value);
    } catch (e) {
      console.error('[LiveStreamPlayer] Error en onPublished handler', e);
    }
  };

  const onUnpublished = (pub: TrackPublication) => {
    try {
      console.log(`[LiveStreamPlayer] Participant ${p.identity} unpublished:`, pub.source);
      if (pub.source === Track.Source.Camera && cameraPublication.value?.trackSid === pub.trackSid) {
        cameraPublication.value = null;
      }
      if (pub.source === Track.Source.ScreenShare && screenSharePublication.value?.trackSid === pub.trackSid) {
        screenSharePublication.value = null;
      }
    } catch (e) {
      console.error('[LiveStreamPlayer] Error en onUnpublished handler', e);
    }
  };

  // registramos
  p.on(ParticipantEvent.TrackPublished, onPublished);
  p.on(ParticipantEvent.TrackUnpublished, onUnpublished);

  participantHandlers.set(p, { onPublished, onUnpublished });
}

function detachParticipantListeners(p: RemoteParticipant) {
  const handlers = participantHandlers.get(p);
  if (!handlers) return;
  try {
    p.off(ParticipantEvent.TrackPublished, handlers.onPublished);
    p.off(ParticipantEvent.TrackUnpublished, handlers.onUnpublished);
  } catch (e) {
    // off puede no lanzar, pero por las dudas atrapamos
    console.warn('[LiveStreamPlayer] Warning detaching handlers', e);
  }
  participantHandlers.delete(p);
}

onMounted(async () => {
  const newRoom = new Room({ adaptiveStream: true, dynacast: true });

  // Al conectar, queremos ENSAMBLAR listeners para todos los participantes actuales
  newRoom.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
    console.log('[LiveStreamPlayer] ParticipantConnected:', (p as any).identity);
    attachParticipantListeners(p as RemoteParticipant);
  });

  newRoom.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
    console.log('[LiveStreamPlayer] ParticipantDisconnected:', (p as any).identity);
    // si era nuestro admin, reseteamos
    if (adminParticipant.value?.identity === (p as any).identity) {
      adminParticipant.value = null;
      cameraPublication.value = null;
      screenSharePublication.value = null;
    }
    detachParticipantListeners(p as RemoteParticipant);
  });

  // DataReceived: aplicamos layout siempre (lo que evita depender exclusivamente de admin ya detectado)
  newRoom.on(RoomEvent.DataReceived, (payload, participant) => {
    try {
      const str = textDecoder.decode(payload as Uint8Array);
      const data = JSON.parse(str);
      // Debug log
      console.log('[LiveStreamPlayer] 📢 DataReceived raw:', data, 'from', participant?.identity);
      // Si viene data válida, aplicamos layoutState inmediatamente
      if (data && typeof data === 'object') {
        Object.assign(layoutState, data);
        // Si admin aún no estaba asignado, asignamos al que envió estos datos
        if (!adminParticipant.value && participant) {
          adminParticipant.value = participant as RemoteParticipant;
          console.log('[LiveStreamPlayer] Assigned adminParticipant from DataReceived:', participant.identity);
        }
      }
    } catch (e) {
      console.error('[LiveStreamPlayer] ❌ Error procesando DataReceived:', e);
    }
  });

  newRoom.on(RoomEvent.Disconnected, () => {
    statusMessage.value = 'La transmisión ha finalizado.';
    cameraPublication.value = null;
    screenSharePublication.value = null;
    // limpiar handlers
    participantHandlers.forEach((_, p) => detachParticipantListeners(p));
    participantHandlers.clear();
  });

  try {
    const response = await apiPublic.get('/streaming/token?viewer=true');
    await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
    console.log('[LiveStreamPlayer] ✅ Conectado a la sala.');

    // attach listeners a los participantes ya presentes en la sala (caso reconexión o publish posterior)
    for (const p of newRoom.remoteParticipants.values()) {
      attachParticipantListeners(p as RemoteParticipant);
    }

    // guardar room
    room.value = newRoom;
    statusMessage.value = 'Conexión exitosa. Esperando al anfitrión...';
  } catch (error) {
    console.error('[LiveStreamPlayer] ❌ Error al conectar:', error);
    statusMessage.value = 'No se pudo conectar a la transmisión.';
  }
});

onUnmounted(() => {
  // limpiar listeners y desconectar
  participantHandlers.forEach((_, p) => detachParticipantListeners(p));
  participantHandlers.clear();
  room.value?.disconnect();
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