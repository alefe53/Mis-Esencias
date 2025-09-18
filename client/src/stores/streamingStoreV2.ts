// RUTA: src/stores/streamingStoreV2.ts
import { defineStore } from 'pinia';
import { shallowRef, computed, watch } from 'vue'; // ❗️ ASEGÚRATE DE IMPORTAR 'computed' Y 'watch'
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

  // =================================================================
  // ✅ 1. ESTADO COMPUTADO PARA EL LAYOUT (LA ÚNICA FUENTE DE VERDAD)
  // Este objeto reactivo contiene toda la información visual que los espectadores necesitan.
  // =================================================================
  const layoutStateForBroadcast = computed(() => ({
    isScreenSharing: streamState.isScreenSharing,
    isCameraFocus: streamState.cameraOverlay.isCameraFocus,
    position: streamState.cameraOverlay.position,
    size: streamState.cameraOverlay.size,
    isCameraEnabled: streamState.isCameraEnabled,
  }));

  // =================================================================
  // ✅ 2. FUNCIÓN DE BROADCAST ÚNICA Y CENTRALIZADA
  // Su única responsabilidad es tomar el estado computado y enviarlo.
  // =================================================================
  const broadcastLayoutState = () => {
    if (room.value?.state !== 'connected' || !room.value.localParticipant) {
      console.warn('[STORE-BROADCAST] ⚠️ Abortando broadcast: no conectado o sin participante local.');
      return;
    }

    const data = new TextEncoder().encode(JSON.stringify(layoutStateForBroadcast.value));
    room.value.localParticipant.publishData(data, { reliable: true });
    console.log('📡 [STORE-BROADCAST] ✅ Layout state broadcasted:', layoutStateForBroadcast.value);
  };

  // =================================================================
  // ✅ 3. ¡LA MAGIA! SINCRONIZACIÓN AUTOMÁTICA
  // Este 'watch' observa cualquier cambio en nuestro estado de layout
  // y llama a la función de broadcast automáticamente. Cero esfuerzo manual.
  // =================================================================
  watch(layoutStateForBroadcast, (newState, oldState) => {
    console.log('👀 [STORE-WATCH] Layout state changed, triggering broadcast.', { from: oldState, to: newState });
    broadcastLayoutState();
  }, { deep: true }); // 'deep' es crucial para detectar cambios dentro del objeto.

  const setupRoomListeners = (newRoom: Room) => {
    console.log('[STORE] 👂 Setting up room listeners...');
    newRoom
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log(`✅ [STORE-EVENT] LocalTrackPublished: ${pub.source}.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = true;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = true;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = true;

        // El 'watch' detectará este cambio y transmitirá automáticamente.
        appEmitter.emit('local-track-changed');
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log(`🛑 [STORE-EVENT] LocalTrackUnpublished: ${pub.source}.`);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = false;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = false;
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = false;
        
        // El 'watch' también detectará este cambio.
        appEmitter.emit('local-track-changed');
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('🚪 [STORE-EVENT] Disconnected from room. Cleaning up...');
        room.value = null;
        localParticipant.value = null;
        previewTrack.value?.stop();
        previewTrack.value = null;
        resetState();
        console.log('🧹 [STORE] Cleanup complete.');
      });
  };

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

  // =================================================================
  // ✅ 4. ACCIONES DE DISPOSITIVO SIMPLIFICADAS
  // Estas funciones solo dan la orden a LiveKit. El estado se actualizará
  // en los listeners, y el 'watch' se encargará de transmitir.
  // =================================================================
  async function toggleCamera() {
    console.log(`[STORE] 🚦 Action: toggleCamera`);
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    try {
      const newState = !streamState.isCameraEnabled;
      await room.value.localParticipant.setCameraEnabled(newState);
      console.log(`[STORE] -> ✅ Camera command sent to set state to ${newState}`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error toggling camera.', e);
      uiStore.showToast({ message: 'Error al cambiar la cámara.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleMicrophone() {
    console.log(`[STORE] 🚦 Action: toggleMicrophone`);
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    try {
      const newState = !streamState.isMicrophoneEnabled;
      await room.value.localParticipant.setMicrophoneEnabled(newState);
      console.log(`[STORE] -> ✅ Microphone command sent to set state to ${newState}`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error toggling microphone.', e);
      uiStore.showToast({ message: 'Error con el micrófono.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleScreenShare() {
    console.log(`[STORE] 🚦 Action: toggleScreenShare`);
    if (!room.value?.localParticipant || isActionPending.value) return;

    isActionPending.value = true;
    try {
      const newState = !streamState.isScreenSharing;
      await room.value.localParticipant.setScreenShareEnabled(newState, { audio: true });
      console.log(`[STORE] -> ✅ Screen share command sent to set state to ${newState}`);
    } catch (e: any) {
      console.error('[STORE] -> ❌ Error toggling screen share.', e);
      if (e.name !== 'NotAllowedError') {
        uiStore.showToast({ message: 'Error al compartir pantalla.', color: '#ef4444' });
      }
    } finally {
      isActionPending.value = false;
    }
  }

  // =================================================================
  // ✅ 5. ACCIONES DE LAYOUT QUE SOLO MUTAN EL ESTADO LOCAL
  // El 'watch' se encargará de transmitir estos cambios automáticamente.
  // =================================================================
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
    console.log(`[STORE] -> ✅ New position set to "${newPosition}"`);
  }

  function toggleCameraFocus() {
    const newState = !_writableState.cameraOverlay.isCameraFocus;
    console.log(`[STORE] 🚦 Action: toggleCameraFocus to ${newState}`);
    _writableState.cameraOverlay.isCameraFocus = newState;
  }
  
  // --- El resto de tus funciones se mantienen igual ---

  async function checkStreamStatus() {
    console.log('[STORE] 🚦 Action: checkStreamStatus');
    try {
      const { data } = await apiPublic.get('/streaming/status');
      _writableState.broadcastState = data.data.is_live ? 'live' : 'idle';
      console.log(`[STORE] -> ✅ Stream status is: ${_writableState.broadcastState}`);
    } catch (error) {
      console.error('[STORE] -> ❌ Error checking stream status:', error);
      _writableState.broadcastState = 'idle';
    }
  }

  function subscribeToStreamStatusChanges() {
    console.log('[STORE] 🚦 Action: subscribeToStreamStatusChanges');
    if (streamStatusChannel) return;
    
    const channel = supabase.channel('public-events');
    channel
      .on('broadcast', { event: 'stream-status-change' }, (payload) => {
        console.log('📢 [STORE-REALTIME] Received stream-status-change event!', payload);
        _writableState.broadcastState = payload.payload.isLive ? 'live' : 'idle';
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [STORE-REALTIME] Successfully subscribed to public-events channel.');
        } else {
          console.error(`[STORE-REALTIME] ❌ Failed to subscribe to Supabase. Status: ${status}`);
        }
      });
    streamStatusChannel = channel;
  }

  function unsubscribeFromStreamStatusChanges() {
    console.log('[STORE] 🚦 Action: unsubscribeFromStreamStatusChanges');
    if (streamStatusChannel) {
      supabase.removeChannel(streamStatusChannel);
      streamStatusChannel = null;
      console.log('🧹 [STORE-REALTIME] Unsubscribed from public-events channel.');
    }
  }

  async function startBroadcast() {
    if (streamState.broadcastState === 'live' || streamState.broadcastState === 'starting') return;
    console.log('[STORE] 🚦 Action: startBroadcast');
    _writableState.broadcastState = 'starting';
    
    try {
      await api.post('/streaming/start');
      _writableState.broadcastState = 'live';
      console.log('[STORE] -> ✅ Stream is LIVE!');
      uiStore.showToast({ message: '¡Estás en vivo!', color: '#10b981' });
    } catch (error) {
      console.error('[STORE] -> ❌ Failed to start broadcast:', error);
      _writableState.broadcastState = 'idle';
      uiStore.showToast({ message: 'Error al iniciar transmisión.', color: '#ef4444' });
    }
  }
  
  async function stopBroadcast() {
    if (streamState.broadcastState !== 'live') return;
    console.log('[STORE] 🚦 Action: stopBroadcast');
    _writableState.broadcastState = 'ending';

    try {
      await api.post('/streaming/stop');
      _writableState.broadcastState = 'idle';
      console.log('[STORE] -> ✅ Broadcast has ended.');
      uiStore.showToast({ message: 'Transmisión finalizada.', color: '#6b7280' });
    } catch (error) {
      console.error('[STORE] -> ❌ Failed to stop broadcast:', error);
      _writableState.broadcastState = 'live';
      uiStore.showToast({ message: 'Error al detener la transmisión.', color: '#ef4444' });
    }
  }

  return {
    streamState,
    previewTrack,
    isActionPending,
    localParticipant,
    checkStreamStatus,
    subscribeToStreamStatusChanges,
    unsubscribeFromStreamStatusChanges,
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
  };
});