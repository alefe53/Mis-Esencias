// RUTA: src/composables/streaming/useStreamStateV2.ts

import { reactive, readonly } from 'vue';

/**
 * Define la estructura completa del estado del stream.
 * Será la única fuente de la verdad para la UI.
 */
export interface StreamStateV2 {
  // Estado de conexión y permisos
  isConnecting: boolean;
  isPublishing: 'inactive' | 'pending' | 'active'; // Estados más claros
  permissionError: string;
  
  // Estado real de los tracks publicados (refleja el estado en LiveKit)
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean; // Lo dejamos listo para el futuro

  // Estado del overlay (preparado para el futuro)
  cameraOverlay: {
    isEnabled: boolean;
    isFullScreen: boolean;
    size: 'xs' | 'sm' | 'md' | 'full';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

// Función para obtener el estado inicial limpio
const getDefaultState = (): StreamStateV2 => ({
  isConnecting: false,
  isPublishing: 'inactive',
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

// Creamos el objeto de estado reactivo que será modificado internamente por el store
const state = reactive<StreamStateV2>(getDefaultState());

/**
 * Composable que gestiona y expone el estado centralizado del stream.
 */
export function useStreamStateV2() {
  const resetState = () => {
    Object.assign(state, getDefaultState());
  };

  return {
    // Exponemos el estado como readonly para que la UI no pueda mutarlo directamente.
    streamState: readonly(state),
    // Exportamos el estado "escribible" solo para que otros composables y el store lo usen.
    _writableState: state, 
    resetState,
  };
}