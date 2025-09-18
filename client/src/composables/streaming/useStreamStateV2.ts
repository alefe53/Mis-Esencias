// RUTA: src/composables/streaming/useStreamStateV2.ts

import { reactive, readonly } from 'vue';

export interface StreamStateV2 {
  isConnecting: boolean;
  isPublishing: 'inactive' | 'pending' | 'active'; 
  permissionError: string;
  
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;

  cameraOverlay: {
    isEnabled: boolean;
    isFullScreen: boolean;
    size: 'xs' | 'sm' | 'md' | 'full';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

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

const state = reactive<StreamStateV2>(getDefaultState());

export function useStreamStateV2() {
  const resetState = () => {
    Object.assign(state, getDefaultState());
  };

  return {
    streamState: readonly(state),
    _writableState: state, 
    resetState,
  };
}