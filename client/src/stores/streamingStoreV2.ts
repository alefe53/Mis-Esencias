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
    newRoom
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log('✅ [EVENT] Track local publicado:', { source: pub.source, name: pub.trackName });
        if (pub.source === Track.Source.Camera) {
          _writableState.isCameraEnabled = true;
        }
        if (pub.source === Track.Source.Microphone) {
          _writableState.isMicrophoneEnabled = true;
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log('🛑 [EVENT] Track local despúblicado:', { source: pub.source, name: pub.trackName });
        if (pub.source === Track.Source.Camera) {
          _writableState.isCameraEnabled = false;
        }
        if (pub.source === Track.Source.Microphone) {
          _writableState.isMicrophoneEnabled = false;
        }
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('🚪 [EVENT] Desconectado del room.');
        leaveStudio(false); 
      });
  };
  
  async function getPermissionsAndPreview() {
    if (previewTrack.value) return;
    try {
      _writableState.permissionError = '';
      const track = await createLocalVideoTrack({ resolution: { width: 1280, height: 720 } });
      previewTrack.value = track;
    } catch (error) {
      console.error("Error de permisos:", error);
      _writableState.permissionError = 'Permiso de cámara denegado. Revisa la configuración del navegador.';
    }
  }

  async function enterStudio() {
    if (room.value || streamState.isConnecting || !previewTrack.value) return;

    _writableState.isConnecting = true;
    try {
      const response = await api.get('/streaming/token');
      const newRoom = new Room({ adaptiveStream: true, dynacast: true });
      
      setupRoomListeners(newRoom);

      await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
      
      room.value = newRoom;
      localParticipant.value = newRoom.localParticipant;

      window.open('/chat-popup', 'chatWindow', 'width=400,height=600,scrollbars=no,resizable=yes');

    } catch (e) {
      console.error('Error al entrar al estudio:', e);
      uiStore.showToast({ message: 'No se pudo conectar al estudio.', color: '#ef4444' });
      await room.value?.disconnect();
      room.value = null;
    } finally {
      _writableState.isConnecting = false;
    }
  }

  async function leaveStudio(intentional = true) {
    if (intentional) {
      await room.value?.disconnect();
    }
    // La limpieza se maneja en el evento 'Disconnected' para evitar duplicación.
    // Pero si es intencional, podemos acelerar la limpieza visual.
    room.value = null;
    localParticipant.value = null;
    previewTrack.value?.stop();
    previewTrack.value = null;
    resetState();
    console.log('🧹 Estado y recursos del stream limpiados.');
  }

  async function publishMedia() {
    if (!room.value?.localParticipant || streamState.isPublishing !== 'inactive' || !previewTrack.value) return;

    _writableState.isPublishing = 'pending';
    try {
      // Publicamos el track de video que ya tenemos de la preview.
      await room.value.localParticipant.publishTrack(previewTrack.value, {
        name: 'user-camera',
        source: Track.Source.Camera,
      });

      // Habilitamos el micrófono y lo publicamos.
      // ❗️ CORRECCIÓN: setMicrophoneEnabled no lleva opciones de 'name'.
      await room.value.localParticipant.setMicrophoneEnabled(true);
      
      // El estado de la UI (isCameraEnabled, isMicrophoneEnabled) será actualizado
      // por los listeners de 'LocalTrackPublished', que es la fuente de verdad.
      _writableState.isPublishing = 'active';

    } catch (e) {
      console.error('Error al publicar media:', e);
      uiStore.showToast({ message: 'Error al iniciar la publicación.', color: '#ef4444' });
      _writableState.isPublishing = 'inactive';
      // Si falla, intentamos revertir las acciones.
      await room.value.localParticipant.setMicrophoneEnabled(false);
      await room.value.localParticipant.unpublishTrack(previewTrack.value);
    }
  }

  // --- Enfoque Optimista para los Toggles ---
  async function toggleCamera() {
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    const currentState = streamState.isCameraEnabled;
    const newState = !currentState;
    
    _writableState.isCameraEnabled = newState; // Actualización optimista

    try {
      await room.value.localParticipant.setCameraEnabled(newState);
    } catch (e) {
      console.error('Error al cambiar estado de la cámara:', e);
      _writableState.isCameraEnabled = currentState; // Revertir en caso de error
      uiStore.showToast({ message: 'Error al cambiar la cámara.', color: '#ef4444' });
    } finally {
      isActionPending.value = false;
    }
  }

  async function toggleMicrophone() {
    if (!room.value?.localParticipant || isActionPending.value) return;
    
    isActionPending.value = true;
    const currentState = streamState.isMicrophoneEnabled;
    const newState = !currentState;
    
    _writableState.isMicrophoneEnabled = newState; // Actualización optimista

    try {
      await room.value.localParticipant.setMicrophoneEnabled(newState);
    } catch (e) {
      console.error('Error al cambiar estado del micrófono:', e);
      _writableState.isMicrophoneEnabled = currentState; // Revertir
      uiStore.showToast({ message: 'Error con el micrófono.', color: '#ef4444' });
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
  };
});