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
  // --- SETUP ---
  const uiStore = useUiStore();
  const { streamState, _writableState, resetState } = useStreamStateV2();

  // --- ESTADO INTERNO DEL STORE ---
  const room = shallowRef<Room | null>(null);
  const localParticipant = shallowRef<LocalParticipant | null>(null);
  const previewTrack = shallowRef<LocalVideoTrack | null>(null);
  const isProcessing = shallowRef(false);

  // --- LÓGICA DE EVENTOS DE LIVEKIT ---
  const setupRoomListeners = (newRoom: Room) => {
    console.log('🎧 Configurando listeners para la sala.');
    newRoom
      .on(RoomEvent.LocalTrackPublished, (pub: TrackPublication) => {
        console.log('🚀 EVENTO: LocalTrackPublished', { source: pub.source, kind: pub.kind });
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = true;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = true;
        broadcastState();
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub: TrackPublication) => {
        console.log('⏸️ EVENTO: LocalTrackUnpublished', { source: pub.source, kind: pub.kind });
        if (pub.source === Track.Source.Camera) _writableState.isCameraEnabled = false;
        if (pub.source === Track.Source.Microphone) _writableState.isMicrophoneEnabled = false;
        broadcastState();
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('🚪 EVENTO: Desconectado de la sala.');
        leaveStudio(false);
      });
  };
  
  const broadcastState = async () => {
    if (!room.value || !room.value.localParticipant.permissions?.canPublishData) return;
    const textEncoder = new TextEncoder();
    const payload = textEncoder.encode(JSON.stringify(streamState));
    await room.value.localParticipant.publishData(payload, { reliable: true });
  };


  // --- ACCIONES EXPUESTAS A LA UI ---

  async function getPermissionsAndPreview() {
    if (previewTrack.value) return;
    try {
      const track = await createLocalVideoTrack({ resolution: { width: 1280, height: 720 } });
      previewTrack.value = track;
      _writableState.permissionError = '';
    } catch (error) {
      _writableState.permissionError = 'Permiso de cámara denegado. Revisa la configuración.';
    }
  }

    async function enterStudio() {
        if (room.value || streamState.isConnecting) return;
        if (!previewTrack.value) {
        uiStore.showToast({ message: 'La cámara no está lista.', color: '#f97316' });
        return;
        }

        console.log('🎬 Iniciando enterStudio...');
        _writableState.isConnecting = true;
        try {
        const response = await api.get('/streaming/token');
        console.log('🔑 Token recibido:', response.data.token ? 'Sí' : 'No');

        const newRoom = new Room({ adaptiveStream: true, dynacast: true });
        
        setupRoomListeners(newRoom);

        console.log('🔗 Conectando a la sala de LiveKit...');
        await newRoom.connect(import.meta.env.VITE_LIVEKIT_URL, response.data.token);
        console.log('✅ Conexión a LiveKit exitosa.');
        
        room.value = newRoom;
        localParticipant.value = newRoom.localParticipant;
        console.log('👤 Participante local establecido:', localParticipant.value);

        window.open('/chat-popup', 'chatWindow', 'width=400,height=600,scrollbars=no');
        } catch (e) {
        console.error('❌ ERROR en enterStudio:', e);
        uiStore.showToast({ message: 'No se pudo entrar al estudio.', color: '#ef4444' });
        await room.value?.disconnect();
        room.value = null;
        } finally {
        _writableState.isConnecting = false;
        console.log('🎬 enterStudio finalizado.');
        }
    }

  async function leaveStudio(intentional = true) {
    if (intentional) {
      await room.value?.disconnect();
    }
    room.value = null;
    localParticipant.value = null;
    previewTrack.value?.stop();
    previewTrack.value = null;
    resetState();
  }

  async function publishMedia() {
    if (!room.value?.localParticipant || streamState.isPublishing !== 'inactive') return;

    _writableState.isPublishing = 'pending';
    try {
      // Publicamos el track de la preview y habilitamos el audio.
      // El estado se actualizará automáticamente gracias a los listeners.
      await room.value.localParticipant.publishTrack(previewTrack.value!);
      await room.value.localParticipant.setMicrophoneEnabled(true);
      
      _writableState.isPublishing = 'active';
    } catch (e) {
      console.error('Error al publicar:', e);
      uiStore.showToast({ message: 'Error al iniciar la publicación.', color: '#ef4444' });
      _writableState.isPublishing = 'inactive';
    }
  }

  async function toggleCamera() {
    if (!room.value?.localParticipant || isProcessing.value) return;
    isProcessing.value = true;
    try {
      // La llamada al SDK disparará el evento que actualizará el estado
      await room.value.localParticipant.setCameraEnabled(!streamState.isCameraEnabled);
    } catch (e) {
      console.error('Error al cambiar cámara:', e);
    } finally {
      isProcessing.value = false;
    }
  }

  async function toggleMicrophone() {
    if (!room.value?.localParticipant || isProcessing.value) return;
    isProcessing.value = true;
    try {
      await room.value.localParticipant.setMicrophoneEnabled(!streamState.isMicrophoneEnabled);
    } catch (e) {
      console.error('Error al cambiar micrófono:', e);
    } finally {
      isProcessing.value = false;
    }
  }

  return {
    // Estado (readonly para la UI)
    streamState,
    
    // Refs para la UI
    previewTrack,
    isProcessing,
    localParticipant, // Lo necesitamos para pasarlo a useParticipantTracksV2

    // Acciones
    getPermissionsAndPreview,
    enterStudio,
    leaveStudio,
    publishMedia,
    toggleCamera,
    toggleMicrophone,
  };
});