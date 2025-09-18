// RUTA: src/stores/streamingStoreV2.ts
import { defineStore } from 'pinia';
import { createLocalVideoTrack, type LocalVideoTrack } from 'livekit-client';
import { useStreamStateV2 } from '../composables/streaming/useStreamStateV2';
import { useLiveKitV2 } from '../composables/streaming/useLiveKitV2';
import { useStreamControlsV2 } from '../composables/streaming/useStreamControlsV2';
import api from '../services/api';
import { useUiStore } from './uiStore';
import { shallowRef } from 'vue';

export const useStreamingStoreV2 = defineStore('streamingV2', () => {
  const uiStore = useUiStore();
  
  // 1. Inicializar los composables
  const { streamState, _writableState, resetState } = useStreamStateV2();
  const { room, connect, disconnect, broadcastState } = useLiveKitV2(_writableState);
  const { isProcessing, toggleCamera, toggleMicrophone } = useStreamControlsV2(room, _writableState, broadcastState);

  // Estado específico del Store (no se sincroniza)
  const previewTrack = shallowRef<LocalVideoTrack | null>(null);

  // --- ACCIONES PRINCIPALES ---

  async function getPermissionsAndPreview() {
    if (previewTrack.value) return;
    try {
      const track = await createLocalVideoTrack({ resolution: { width: 1280, height: 720 } });
      previewTrack.value = track;
      _writableState.permissionError = '';
    } catch (error) {
      _writableState.permissionError = 'Permiso de cámara denegado. Revisa la configuración del navegador.';
    }
  }

  async function enterStudio() {
    if (room.value || streamState.isConnecting) return;
    if (!previewTrack.value) {
      _writableState.permissionError = 'La cámara no está lista.';
      return;
    }

    _writableState.isConnecting = true;
    try {
      const response = await api.get('/streaming/token');
      await connect(response.data.token);
      window.open('/chat-popup', 'chatWindow', 'width=400,height=600,scrollbars=no');
    } catch (e) {
      uiStore.showToast({ message: 'No se pudo entrar al estudio.', color: '#ef4444' });
      await disconnect();
    } finally {
      _writableState.isConnecting = false;
    }
  }

  async function leaveStudio() {
    await disconnect();
    resetState();
    previewTrack.value?.stop();
    previewTrack.value = null;
  }

  async function publishMedia() {
    if (!room.value?.localParticipant || streamState.isPublishing === 'active') return;

    _writableState.isPublishing = 'pending';
    try {
      // Publicamos el track de la preview y el audio
      await room.value.localParticipant.publishTrack(previewTrack.value!);
      await room.value.localParticipant.setMicrophoneEnabled(true);

      // Sincronizamos el estado central
      _writableState.isCameraEnabled = true;
      _writableState.isMicrophoneEnabled = true;
      _writableState.isPublishing = 'active';

      await broadcastState(); // Transmitimos el estado inicial
    } catch (e) {
      console.error('Error al publicar:', e);
      uiStore.showToast({ message: 'Error al iniciar la publicación.', color: '#ef4444' });
      _writableState.isPublishing = false;
    }
  }
  
  return {
    // Estado (solo lectura para la UI)
    streamState,
    previewTrack,
    isProcessing,
    room, // Exponemos la room para que la UI pueda acceder a `localParticipant`

    // Acciones
    getPermissionsAndPreview,
    enterStudio,
    leaveStudio,
    publishMedia,
    toggleCamera,
    toggleMicrophone,
  };
});