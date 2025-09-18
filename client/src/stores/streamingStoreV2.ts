// RUTA: src/stores/streamingStoreV2.ts
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { 
  createLocalVideoTrack, 
  Room, 
  RoomEvent, 
  Track, 
  type LocalParticipant, 
  type LocalVideoTrack, 
  type TrackPublication 
} from 'livekit-client';

import { useStreamStateV2 } from '../composables/streaming/useStreamStateV2';
import api from '../services/api';
import { useUiStore } from './uiStore';

export const useStreamingStoreV2 = defineStore('streamingV2', () => {
  const uiStore = useUiStore();
  const { streamState, _writableState, resetState } = useStreamStateV2();

  const room = shallowRef<Room | null>(null);
  const localParticipant = shallowRef<LocalParticipant | null>(null);
  const previewTrack = shallowRef<LocalVideoTrack | null>(null);
  const isActionPending = shallowRef(false);

 const setupRoomListeners = (newRoom: Room) => {
    console.log('[STORE] 👂 Setting up room listeners...');
    newRoom
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log(`✅ [STORE-EVENT] LocalTrackPublished: ${pub.source}`, pub);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = true;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = true;
        // ❗️ NUEVO: Reaccionamos a la publicación de la pantalla
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = true;
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log(`🛑 [STORE-EVENT] LocalTrackUnpublished: ${pub.source}`, pub);
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = false;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = false;
        // ❗️ NUEVO: Reaccionamos a la des-publicación de la pantalla
        if (pub.source === Track.Source.ScreenShare) _writableState.isScreenSharing = false;
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
    if (previewTrack.value) {
      console.log('[STORE] -> Preview track already exists. Skipping.');
      return;
    }
    try {
      _writableState.permissionError = '';
      const track = await createLocalVideoTrack({ resolution: { width: 1280, height: 720 } });
      previewTrack.value = track;
      console.log('[STORE] -> ✅ Permissions granted and preview track created.', track);
    } catch (error) {
      console.error("[STORE] -> ❌ Error getting permissions:", error);
      _writableState.permissionError = 'Permiso de cámara denegado. Revisa la configuración del navegador.';
    }
  }

  async function enterStudio() {
    console.log('[STORE] 🚦 Action: enterStudio');
    if (room.value || streamState.isConnecting || !previewTrack.value) {
      console.warn('[STORE] -> Aborting enterStudio. Conditions not met:', { hasRoom: !!room.value, isConnecting: streamState.isConnecting, hasPreview: !!previewTrack.value });
      return;
    }

    _writableState.isConnecting = true;
    try {
      const response = await api.get('/streaming/token');
      const newRoom = new Room({ adaptiveStream: true, dynacast: true });
      
      setupRoomListeners(newRoom);

      console.log('[STORE] -> Connecting to LiveKit...');
      await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
      
      room.value = newRoom;
      localParticipant.value = newRoom.localParticipant;
      console.log('[STORE] -> ✅ Successfully connected to room. Local participant is set.', newRoom.localParticipant);

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
    if (intentional && room.value) {
      // El evento 'Disconnected' se encargará de la limpieza final.
      await room.value.disconnect();
    } else if (!room.value) {
      // Si no hay room, forzamos la limpieza por si quedó algo colgado.
      console.log('[STORE] -> No room object found, performing manual cleanup.');
      localParticipant.value = null;
      previewTrack.value?.stop();
      previewTrack.value = null;
      resetState();
    }
  }

  async function publishMedia() {
    console.log('[STORE] 🚦 Action: publishMedia');
    if (!room.value?.localParticipant || streamState.isPublishing !== 'inactive' || !previewTrack.value) {
      console.warn('[STORE] -> Aborting publishMedia. Conditions not met.');
      return;
    }

    _writableState.isPublishing = 'pending';
    try {
      console.log('[STORE] -> Publishing camera track...');
      await room.value.localParticipant.publishTrack(previewTrack.value, {
        name: 'user-camera',
        source: Track.Source.Camera,
      });
      console.log('[STORE] -> ✅ Camera track published. Enabling microphone...');
      
      // ❗️ CORRECCIÓN: setMicrophoneEnabled no lleva opciones de 'name'.
      await room.value.localParticipant.setMicrophoneEnabled(true);
      console.log('[STORE] -> ✅ Microphone enabled.');
      
      _writableState.isPublishing = 'active';
    } catch (e) {
      console.error('[STORE] -> ❌ Error publishing media:', e);
      uiStore.showToast({ message: 'Error al iniciar la publicación.', color: '#ef4444' });
      _writableState.isPublishing = 'inactive';
      
      console.log('[STORE] -> Attempting to revert publishing actions...');
      await room.value.localParticipant?.setMicrophoneEnabled(false);
      if (previewTrack.value) {
          await room.value.localParticipant?.unpublishTrack(previewTrack.value);
      }
    }
  }

  async function toggleCamera() {
    const newState = !streamState.isCameraEnabled;
    console.log(`[STORE] 🚦 Action: toggleCamera to ${newState}`);
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    const currentState = streamState.isCameraEnabled;
    
    _writableState.isCameraEnabled = newState; // Actualización optimista

    try {
      await room.value.localParticipant.setCameraEnabled(newState);
      console.log(`[STORE] -> ✅ Camera state successfully set to ${newState}`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error toggling camera. Reverting state.', e);
      _writableState.isCameraEnabled = currentState; // Revertir
      uiStore.showToast({ message: 'Error al cambiar la cámara.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleMicrophone() {
    const newState = !streamState.isMicrophoneEnabled;
    console.log(`[STORE] 🚦 Action: toggleMicrophone to ${newState}`);
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    const currentState = streamState.isMicrophoneEnabled;
    
    _writableState.isMicrophoneEnabled = newState; // Actualización optimista

    try {
      await room.value.localParticipant.setMicrophoneEnabled(newState);
       console.log(`[STORE] -> ✅ Microphone state successfully set to ${newState}`);
    } catch (e) {
      console.error('[STORE] -> ❌ Error toggling microphone. Reverting state.', e);
      _writableState.isMicrophoneEnabled = currentState; // Revertir
      uiStore.showToast({ message: 'Error con el micrófono.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleScreenShare() {
    const newState = !streamState.isScreenSharing;
    console.log(`[STORE] 🚦 Action: toggleScreenShare to ${newState}`);
    if (!room.value?.localParticipant || isActionPending.value) return;

    isActionPending.value = true;
    const currentState = streamState.isScreenSharing;

    // Actualización optimista para que la UI reaccione al instante
    _writableState.isScreenSharing = newState;

    try {
      // Usamos el método del SDK. Esto mostrará al usuario el diálogo para elegir qué compartir.
      await room.value.localParticipant.setScreenShareEnabled(newState, { audio: true });
      console.log(`[STORE] -> ✅ Screen share state successfully set to ${newState}`);
    } catch (e: any) {
      console.error('[STORE] -> ❌ Error toggling screen share. Reverting state.', e);
      // Si el usuario cancela el diálogo, el SDK lanza un error "NotAllowedError".
      // Revertimos el estado para que la UI vuelva a la normalidad.
      _writableState.isScreenSharing = currentState;
      if (e.name !== 'NotAllowedError') {
        uiStore.showToast({ message: 'Error al compartir pantalla.', color: '#ef4444' });
      }
    } finally {
      isActionPending.value = false;
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
  };
});