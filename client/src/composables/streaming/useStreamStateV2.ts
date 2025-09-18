// RUTA: src/composables/streaming/useStreamStateV2.ts
import { reactive, readonly } from 'vue';

/**
 * Define la estructura completa del estado del stream.
 * Será la única fuente de la verdad para la UI.
 */
export interface StreamState {
  // Estado de conexión y publicación
  isConnecting: boolean;
  isPublishing: false | 'pending' | 'active'; // Para más control
  permissionError: string;
  
  // Estado de los dispositivos
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;

  // Estado del overlay (preparado para el futuro)
  cameraOverlay: {
    isEnabled: boolean;
    isFullScreen: boolean;
    size: 'xs' | 'sm' | 'md' | 'full';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

// Función para obtener el estado inicial
const getDefaultState = (): StreamState => ({
  isConnecting: false,
  isPublishing: false,
  permissionError: '',
  isCameraEnabled: false,
  isMicrophoneEnabled: false,
  isScreenSharing: false,
  cameraOverlay: {
    isEnabled: true,
    isFullScreen: false,
    size: 'sm',
    position: 'bottom-right',
  },
});

// Creamos el objeto de estado reactivo
const streamState = reactive<StreamState>(getDefaultState());

/**
 * Composable que gestiona el estado centralizado del stream.
 */
export function useStreamStateV2() {
  const resetState = () => {
    Object.assign(streamState, getDefaultState());
  };

  return {
    // Exponemos el estado como readonly para que solo se pueda modificar
    // a través de las acciones de los otros composables, no directamente.
    streamState: readonly(streamState),
    // Exportamos el estado "crudo" para que los composables puedan mutarlo
    _writableState: streamState, 
    resetState,
  };
}