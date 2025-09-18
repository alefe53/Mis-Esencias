// RUTA: src/stores/streamingStoreV2.ts
import { defineStore } from 'pinia';
import { shallowRef, computed, watch } from 'vue';
import {
  createLocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  type LocalParticipant,
  type LocalVideoTrack,
  type TrackPublication
} from 'livekit-client';

import { useStreamStateV2, type OverlaySize, type OverlayPosition } from '../composables/streaming/useStreamStateV2';
import api from '../services/api';
import { useUiStore } from './uiStore';
import { appEmitter } from '../utils/eventEmitter';
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

  // 1. ESTADO COMPUTADO PARA EL LAYOUT (LA ÚNICA FUENTE DE VERDAD)
  const layoutStateForBroadcast = computed(() => ({
    isScreenSharing: streamState.isScreenSharing,
    isCameraFocus: streamState.cameraOverlay.isCameraFocus,
    position: streamState.cameraOverlay.position,
    size: streamState.cameraOverlay.size,
    isCameraEnabled: streamState.isCameraEnabled,
  }));

  // 2. FUNCIÓN DE BROADCAST ÚNICA Y CENTRALIZADA
  const broadcastLayoutState = () => {
    if (room.value?.state !== 'connected' || !room.value.localParticipant) {
      console.warn('[STORE-BROADCAST] ⚠️ Abortando broadcast: no conectado.');
      return;
    }
    const data = new TextEncoder().encode(JSON.stringify(layoutStateForBroadcast.value));
    room.value.localParticipant.publishData(data, { reliable: true });
    console.log('📡 [STORE-BROADCAST] ✅ Layout state broadcasted:', layoutStateForBroadcast.value);
  };

  // 3. SINCRONIZACIÓN AUTOMÁTICA
  watch(layoutStateForBroadcast, (_newState, _oldState) => {
    console.log('👀 [STORE-WATCH] Layout state changed, triggering broadcast.');
    broadcastLayoutState();
  }, { deep: true });

  // 4. LISTENERS DE EVENTOS (ACTÚAN COMO CONFIRMACIÓN)
  const setupRoomListeners = (newRoom: Room) => {
    newRoom
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log(`✅ [STORE-EVENT] LocalTrackPublished: ${pub.source}. Confirmando estado.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = true;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = true;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = true;
        appEmitter.emit('local-track-changed');
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log(`🛑 [STORE-EVENT] LocalTrackUnpublished: ${pub.source}. Confirmando estado.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = false;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = false;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = false;
        appEmitter.emit('local-track-changed');
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('🚪 [STORE-EVENT] Disconnected. Cleaning up...');
        resetState();
      });
  };

  // 5. ACCIONES HÍBRIDAS (ACTUALIZACIÓN DIRECTA + COMANDO)
  async function toggleCamera() {
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    // ❗️ CAMBIO CLAVE: Calculamos el nuevo estado y lo aplicamos DIRECTAMENTE.
    const newState = !streamState.isCameraEnabled;
    console.log(`[STORE] 🚦 Action: toggleCamera. Setting state to ${newState}`);
    _writableState.isCameraEnabled = newState; // Esto dispara el WATCH y sincroniza la UI al instante.

    isActionPending.value = true;
    try {
      await room.value.localParticipant.setCameraEnabled(newState);
      console.log(`[STORE] -> ✅ Camera command sent to LiveKit.`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error sending toggleCamera command. Reverting UI state.', e);
      _writableState.isCameraEnabled = !newState; // Revertimos si el comando falla.
      uiStore.showToast({ message: 'Error al cambiar la cámara.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleScreenShare() {
    if (!room.value?.localParticipant || isActionPending.value) return;

    const newState = !streamState.isScreenSharing;
    console.log(`[STORE] 🚦 Action: toggleScreenShare. Setting state to ${newState}`);
    _writableState.isScreenSharing = newState; // Actualización directa para que la UI reaccione

    isActionPending.value = true;
    try {
      // 1. Ejecutar el comando principal de compartir pantalla
      await room.value.localParticipant.setScreenShareEnabled(newState, { audio: true });
      console.log(`[STORE] -> ✅ Screen share command sent to LiveKit.`);

      // ❗️ 2. LÓGICA DE REINICIO DE CÁMARA (SOLO AL INICIAR SCREEN SHARE)
      if (newState === true) {
        console.log('[STORE] -> 🔄 Refreshing camera track post-screenshare...');
        // 3. Esperar un momento para que el navegador se estabilice
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // 4. Si la cámara debía estar encendida, forzar el ciclo de reinicio
        if (streamState.isCameraEnabled) {
          console.log('[STORE] -> -> Camera is enabled, performing refresh cycle (off/on).');
          await room.value.localParticipant.setCameraEnabled(false);
          // Pequeña pausa entre apagar y prender
          await new Promise(resolve => setTimeout(resolve, 100)); 
          await room.value.localParticipant.setCameraEnabled(true);
          console.log('[STORE] -> ✅ Camera refresh cycle complete.');
        } else {
            console.log('[STORE] -> -> Camera is disabled, skipping refresh cycle.');
        }
      }
    } catch (e: any) {
      console.error('[STORE] -> ❌ Error in toggleScreenShare process. Reverting UI state.', e);
      _writableState.isScreenSharing = !newState; // Revertimos si algo falla
      if (e.name !== 'NotAllowedError') {
        uiStore.showToast({ message: 'Error al compartir pantalla.', color: '#ef4444' });
      }
    } finally {
      isActionPending.value = false;
    }
  }

  // Las acciones de layout solo mutan el estado. El watch hace el resto.
  function setCameraOverlaySize(size: OverlaySize) {
    console.log(`[STORE] 🚦 Action: setCameraOverlaySize to "${size}"`);
    _writableState.cameraOverlay.size = size;
  }

  function cycleCameraOverlayPosition() {
    console.log('[STORE] 🚦 Action: cycleCameraOverlayPosition');
    const positions: OverlayPosition[] = ['bottom-left', 'top-left', 'top-right', 'bottom-right'];
    const currentIndex = positions.indexOf(streamState.cameraOverlay.position);
    const newPosition = positions[(currentIndex + 1) % positions.length];
    _writableState.cameraOverlay.position = newPosition;
  }

  function toggleCameraFocus() {
    console.log(`[STORE] 🚦 Action: toggleCameraFocus`);
    _writableState.cameraOverlay.isCameraFocus = !_writableState.cameraOverlay.isCameraFocus;
  }
  
  // --- El resto de tus funciones se mantienen igual, no necesitan cambios ---
  // (getPermissionsAndPreview, enterStudio, publishMedia, startBroadcast, etc.)

  async function getPermissionsAndPreview() {
    console.log('[STORE] 🚦 Action: getPermissionsAndPreview');
    if (previewTrack.value) return;
    try {
      _writableState.permissionError = '';
      const track = await createLocalVideoTrack({ resolution: { width: 1280, height: 720 } });
      previewTrack.value = track;
      console.log('[STORE] -> ✅ Permissions granted and preview track created.');
    } catch (error) {
      console.error("[STORE] -> ❌ Error getting permissions:", error);
      _writableState.permissionError = 'Permiso de cámara denegado. Revisa la configuración del navegador.';
    }
  }

  async function enterStudio() {
    console.log('[STORE] 🚦 Action: enterStudio');
    if (room.value || streamState.isConnecting || !previewTrack.value) return;

    _writableState.isConnecting = true;
    try {
      const response = await api.get('/streaming/token');
      const newRoom = new Room({ adaptiveStream: true, dynacast: true });
      
      setupRoomListeners(newRoom);

      console.log('[STORE] -> Connecting to LiveKit...');
      await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
      
      room.value = newRoom;
      localParticipant.value = newRoom.localParticipant;
      console.log('[STORE] -> ✅ Successfully connected to room.');

      window.open('/chat-popup', 'chatWindow', 'width=400,height=600,scrollbars=no,resizable=yes');
    } catch (e) {
      console.error('[STORE] -> ❌ Error entering studio:', e);
      uiStore.showToast({ message: 'No se pudo conectar al estudio.', color: '#ef4444' });
      await room.value?.disconnect();
    } finally {
      _writableState.isConnecting = false;
    }
  }
  
  async function leaveStudio(intentional = true) {
    console.log(`[STORE] 🚦 Action: leaveStudio (intentional: ${intentional})`);
    if (streamState.broadcastState === 'live') {
      await stopBroadcast();
    }
    if (intentional && room.value) {
      await room.value.disconnect();
    } else if (!room.value) {
      resetState();
    }
  }

  async function publishMedia() {
    console.log('[STORE] 🚦 Action: publishMedia');
    if (!room.value?.localParticipant || streamState.isPublishing !== 'inactive' || !previewTrack.value) return;

    _writableState.isPublishing = 'pending';
    try {
      console.log('[STORE] -> Publishing camera track...');
      await room.value.localParticipant.publishTrack(previewTrack.value, {
        name: 'user-camera',
        source: Track.Source.Camera,
      });
      
      console.log('[STORE] -> ✅ Camera track published. Enabling microphone...');
      await room.value.localParticipant.setMicrophoneEnabled(true);
      console.log('[STORE] -> ✅ Microphone enabled.');
      
      _writableState.isPublishing = 'active';
    } catch (e) {
      console.error('[STORE] -> ❌ Error publishing media:', e);
      uiStore.showToast({ message: 'Error al iniciar la publicación.', color: '#ef4444' });
      _writableState.isPublishing = 'inactive';
      
      await room.value.localParticipant?.setMicrophoneEnabled(false);
      if (previewTrack.value) {
          await room.value.localParticipant?.unpublishTrack(previewTrack.value);
      }
    }
  }

  async function toggleMicrophone() {
    if (!room.value?.localParticipant || isActionPending.value) return;
    const newState = !streamState.isMicrophoneEnabled;
    console.log(`[STORE] 🚦 Action: toggleMicrophone. Setting state to ${newState}`);
    _writableState.isMicrophoneEnabled = newState;

    isActionPending.value = true;
    try {
      await room.value.localParticipant.setMicrophoneEnabled(newState);
      console.log(`[STORE] -> ✅ Microphone command sent to LiveKit.`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error sending toggleMicrophone command. Reverting.', e);
      _writableState.isMicrophoneEnabled = !newState;
      uiStore.showToast({ message: 'Error con el micrófono.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  // Funciones de estado del broadcast (start, stop, check, subscribe)
  async function checkStreamStatus() {
    try {
      const { data } = await apiPublic.get('/streaming/status');
      _writableState.broadcastState = data.data.is_live ? 'live' : 'idle';
    } catch (error) {
      _writableState.broadcastState = 'idle';
    }
  }

  function subscribeToStreamStatusChanges() {
    if (streamStatusChannel) return;
    const channel = supabase.channel('public-events');
    channel
      .on('broadcast', { event: 'stream-status-change' }, (payload) => {
        _writableState.broadcastState = payload.payload.isLive ? 'live' : 'idle';
      })
      .subscribe();
    streamStatusChannel = channel;
  }

  function unsubscribeFromStreamStatusChanges() {
    if (streamStatusChannel) {
      supabase.removeChannel(streamStatusChannel);
      streamStatusChannel = null;
    }
  }
  
  async function startBroadcast() {
    if (streamState.broadcastState === 'live' || streamState.broadcastState === 'starting') return;
    _writableState.broadcastState = 'starting';
    try {
      await api.post('/streaming/start');
      _writableState.broadcastState = 'live';
      uiStore.showToast({ message: '¡Estás en vivo!', color: '#10b981' });
    } catch (error) {
      _writableState.broadcastState = 'idle';
      uiStore.showToast({ message: 'Error al iniciar transmisión.', color: '#ef4444' });
    }
  }
  
  async function stopBroadcast() {
    if (streamState.broadcastState !== 'live') return;
    _writableState.broadcastState = 'ending';
    try {
      await api.post('/streaming/stop');
      _writableState.broadcastState = 'idle';
      uiStore.showToast({ message: 'Transmisión finalizada.', color: '#6b7280' });
    } catch (error) {
      _writableState.broadcastState = 'live';
      uiStore.showToast({ message: 'Error al detener la transmisión.', color: '#ef4444' });
    }
  }


  return {
    streamState,
    previewTrack,
    isActionPending,
    localParticipant,
    getPermissionsAndPreview,
    enterStudio,
    leaveStudio,
    publishMedia,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    setCameraOverlaySize,
    cycleCameraOverlayPosition,
    toggleCameraFocus,
    startBroadcast,
    stopBroadcast,
    checkStreamStatus,
    subscribeToStreamStatusChanges,
    unsubscribeFromStreamStatusChanges,
  };
});