// RUTA: src/stores/streamingStoreV2.ts

import { defineStore } from 'pinia';
import { shallowRef, computed, watch } from 'vue';
import {
  createLocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  type LocalParticipant,
  LocalVideoTrack,
  type TrackPublication,
  type VideoCaptureOptions,
  LocalTrackPublication, // Asegúrate de importar esto
} from 'livekit-client';

import { useStreamStateV2, type OverlaySize, type OverlayPosition } from '../composables/streaming/useStreamStateV2';
import api from '../services/api';
import { useUiStore } from './uiStore';
// El appEmitter ya no es necesario aquí si lo quitaste
// import { appEmitter } from '../utils/eventEmitter'; 
import { supabase } from '../services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import apiPublic from '../services/apiPublic';

let streamStatusChannel: RealtimeChannel | null = null;

export const useStreamingStoreV2 = defineStore('streamingV2', () => {
  const uiStore = useUiStore();
  const { streamState, _writableState, resetState } = useStreamStateV2();

  const room = shallowRef<Room | null>(null);
  const localParticipant = shallowRef<LocalParticipant | null>(null);
  const previewTrack = shallowRef<LocalVideoTrack | null>(null);
  const isActionPending = shallowRef(false);

  const cameraOptions: VideoCaptureOptions = { resolution: { width: 1280, height: 720 } };

  const layoutStateForBroadcast = computed(() => ({
    isScreenSharing: streamState.isScreenSharing,
    isCameraFocus: streamState.cameraOverlay.isCameraFocus,
    position: streamState.cameraOverlay.position,
    size: streamState.cameraOverlay.size,
    isCameraEnabled: streamState.isCameraEnabled,
  }));

  const broadcastLayoutState = () => {
    if (room.value?.state !== 'connected' || !room.value.localParticipant) {
      return;
    }
    const payload = { ...layoutStateForBroadcast.value, ts: Date.now() };
    const data = new TextEncoder().encode(JSON.stringify(payload));
    room.value.localParticipant.publishData(data, { reliable: true });
    console.log('📡 [STORE-BROADCAST] ✅ Layout state broadcasted:', payload);
  };

  watch(layoutStateForBroadcast, broadcastLayoutState, { deep: true });

  function broadcastWithRetries(times = [250, 800, 2000]) {
    times.forEach((delay, idx) => {
      setTimeout(() => {
        console.log(`[STORE-BROADCAST-RETRY] -> Intento ${idx + 1} (delay ${delay}ms)`);
        broadcastLayoutState();
      }, delay);
    });
  }


  const setupRoomListeners = (newRoom: Room) => {
    newRoom
        .on(RoomEvent.ParticipantConnected, () => {
            console.log('👤 [STORE-EVENT] Un espectador se ha conectado. Enviando estado actual del layout...');
            broadcastWithRetries();
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const text = new TextDecoder().decode(payload as Uint8Array);
          const data = JSON.parse(text);
          if (data?.type === 'request_layout') {
            console.log(`[STORE-EVENT] -> Petición de layout recibida de ${participant?.identity}. Respondiendo...`);
            // Responder inmediatamente a la petición
            broadcastLayoutState();
          }
        } catch (e) {
          console.error(e);
        }
      })
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log(`✅ [STORE-EVENT] LocalTrackPublished: ${pub.source}.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = true;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = true;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = true;
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log(`🛑 [STORE-EVENT] LocalTrackUnpublished: ${pub.source}.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = false;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = false;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = false;
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('🚪 [STORE-EVENT] Disconnected. Cleaning up...');
        resetState();
      });
  };
  
  async function restartCameraTrack() {
  if (!room.value?.localParticipant) return;
  const participant = room.value.localParticipant;
  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
  const cameraTrack = cameraPublication?.track;

  if (!cameraTrack || !(cameraTrack instanceof LocalVideoTrack)) {
    console.warn('[STORE-RESTART-CAM] -> ⚠️ No se encontró un track de video local para reiniciar.');
    return;
  }

  console.log('[STORE-RESTART-CAM] -> 🚀 Iniciando reinicio de track de cámara.');
  try {
    // ¡Este es el método correcto! Se llama sobre el track.
    await cameraTrack.restartTrack(cameraOptions);
    console.log('[STORE-RESTART-CAM] -> ✅ Track de cámara reiniciado exitosamente.');
  } catch (e) {
    console.error('[STORE-RESTART-CAM] -> ❌ Error reiniciando el track de cámara:', e);
  }
}


  async function toggleScreenShare() {
      if (!room.value?.localParticipant || isActionPending.value) return;
      const newState = !streamState.isScreenSharing;
      _writableState.isScreenSharing = newState;
      isActionPending.value = true;
      try {
        await room.value.localParticipant.setScreenShareEnabled(newState, { audio: true });
        console.log(`[STORE] -> ✅ Comando de ScreenShare enviado a LiveKit.`);
        if (newState === true && streamState.isCameraEnabled) {
          await new Promise(resolve => setTimeout(resolve, 300));
          await restartCameraTrack();
        }
      } catch (e: any) {
        console.error('[STORE] -> ❌ Error en toggleScreenShare. Revirtiendo estado.', e);
        _writableState.isScreenSharing = !newState;
      } finally {
        isActionPending.value = false;
      }
    }


  async function toggleCamera() {
    if (!room.value?.localParticipant || isActionPending.value) return;
    const newState = !streamState.isCameraEnabled;
    _writableState.isCameraEnabled = newState; 
    isActionPending.value = true;
    try {
      await room.value.localParticipant.setCameraEnabled(newState);
    } catch (e) {
      _writableState.isCameraEnabled = !newState;
    } finally {
      isActionPending.value = false;
    }
  }

  // --- El resto de tus funciones se mantienen sin cambios ---
  function setCameraOverlaySize(size: OverlaySize) { _writableState.cameraOverlay.size = size; }
  function cycleCameraOverlayPosition() { const p: OverlayPosition[] = ['bottom-left', 'top-left', 'top-right', 'bottom-right']; const i = p.indexOf(streamState.cameraOverlay.position); _writableState.cameraOverlay.position = p[(i + 1) % p.length]; }
  function toggleCameraFocus() { _writableState.cameraOverlay.isCameraFocus = !_writableState.cameraOverlay.isCameraFocus; }
  async function getPermissionsAndPreview() { if (previewTrack.value) return; try { const track = await createLocalVideoTrack(cameraOptions); previewTrack.value = track; } catch (e) { _writableState.permissionError = 'Permiso denegado.'; } }
  async function enterStudio() { if (room.value || streamState.isConnecting || !previewTrack.value) return; _writableState.isConnecting = true; try { const res = await api.get('/streaming/token'); const newRoom = new Room({ adaptiveStream: true, dynacast: true }); setupRoomListeners(newRoom); await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, res.data.token); room.value = newRoom; localParticipant.value = newRoom.localParticipant; window.open('/chat-popup', 'chatWindow', 'width=400,height=600,scrollbars=no,resizable=yes'); } catch (e) { await room.value?.disconnect(); } finally { _writableState.isConnecting = false; } }
  async function leaveStudio(intentional = true) { if (streamState.broadcastState === 'live') { await stopBroadcast(); } if (intentional && room.value) { await room.value.disconnect(); } else if (!room.value) { resetState(); } }
  async function publishMedia() { if (!room.value?.localParticipant || streamState.isPublishing !== 'inactive' || !previewTrack.value) return; _writableState.isPublishing = 'pending'; try { await room.value.localParticipant.publishTrack(previewTrack.value, { name: 'user-camera', source: Track.Source.Camera }); await room.value.localParticipant.setMicrophoneEnabled(true); _writableState.isPublishing = 'active'; } catch (e) { _writableState.isPublishing = 'inactive'; } }
  async function toggleMicrophone() { if (!room.value?.localParticipant || isActionPending.value) return; const newState = !streamState.isMicrophoneEnabled; _writableState.isMicrophoneEnabled = newState; isActionPending.value = true; try { await room.value.localParticipant.setMicrophoneEnabled(newState); } catch (e) { _writableState.isMicrophoneEnabled = !newState; } finally { isActionPending.value = false; } }
  async function checkStreamStatus() { try { const { data } = await apiPublic.get('/streaming/status'); _writableState.broadcastState = data.data.is_live ? 'live' : 'idle'; } catch (error) { _writableState.broadcastState = 'idle'; } }
  function subscribeToStreamStatusChanges() { if (streamStatusChannel) return; const channel = supabase.channel('public-events'); channel.on('broadcast', { event: 'stream-status-change' }, (payload) => { _writableState.broadcastState = payload.payload.isLive ? 'live' : 'idle'; }).subscribe(); streamStatusChannel = channel; }
  function unsubscribeFromStreamStatusChanges() { if (streamStatusChannel) { supabase.removeChannel(streamStatusChannel); streamStatusChannel = null; } }
  async function startBroadcast() { if (streamState.broadcastState === 'live' || streamState.broadcastState === 'starting') return; _writableState.broadcastState = 'starting'; try { await api.post('/streaming/start'); _writableState.broadcastState = 'live'; } catch (error) { _writableState.broadcastState = 'idle'; } }
  async function stopBroadcast() { if (streamState.broadcastState !== 'live') return; _writableState.broadcastState = 'ending'; try { await api.post('/streaming/stop'); _writableState.broadcastState = 'idle'; } catch (error) { _writableState.broadcastState = 'live'; } }

  return { streamState, previewTrack, isActionPending, localParticipant, getPermissionsAndPreview, enterStudio, leaveStudio, publishMedia, toggleCamera, toggleMicrophone, toggleScreenShare, setCameraOverlaySize, cycleCameraOverlayPosition, toggleCameraFocus, startBroadcast, stopBroadcast, checkStreamStatus, subscribeToStreamStatusChanges, unsubscribeFromStreamStatusChanges, };
});