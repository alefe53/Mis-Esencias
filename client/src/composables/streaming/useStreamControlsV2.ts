// RUTA: src/composables/streaming/useStreamControlsV2.ts
import { ref, type ShallowRef } from 'vue';
import { type Room } from 'livekit-client';
import type { StreamState } from './useStreamStateV2';

/**
 * Composable que proporciona las funciones para controlar los dispositivos.
 */
export function useStreamControlsV2(
  room: ShallowRef<Room | null>,
  state: StreamState,
  broadcast: () => Promise<void>
) {
  const isProcessing = ref(false);

  const toggleCamera = async () => {
    if (!room.value?.localParticipant || isProcessing.value) return;

    isProcessing.value = true;
    const newState = !state.isCameraEnabled;
    
    try {
      // 1. Actualiza el estado local inmediatamente
      state.isCameraEnabled = newState;
      // 2. Llama al SDK de LiveKit
      await room.value.localParticipant.setCameraEnabled(newState);
      // 3. Transmite el nuevo estado
      await broadcast();
    } catch (e) {
      console.error('Error al cambiar la cámara:', e);
      // Revertir en caso de error
      state.isCameraEnabled = room.value.localParticipant.isCameraEnabled;
      await broadcast();
    } finally {
      isProcessing.value = false;
    }
  };

  const toggleMicrophone = async () => {
    if (!room.value?.localParticipant || isProcessing.value) return;

    isProcessing.value = true;
    const newState = !state.isMicrophoneEnabled;
    try {
      state.isMicrophoneEnabled = newState;
      await room.value.localParticipant.setMicrophoneEnabled(newState);
      await broadcast();
    } catch (e) {
      console.error('Error al cambiar el micrófono:', e);
      state.isMicrophoneEnabled = room.value.localParticipant.isMicrophoneEnabled;
      await broadcast();
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    toggleCamera,
    toggleMicrophone,
  };
}