// RUTA: src/composables/streaming/useStreamStateV2.ts

import { reactive, readonly } from 'vue';

export type OverlaySize = 'sm' | 'md' | 'lg';
export type OverlayPosition = 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right';


export interface StreamStateV2 {
  isConnecting: boolean;
  isPublishing: 'inactive' | 'pending' | 'active'; 
  permissionError: string;
  
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;

  cameraOverlay: {
    isEnabled: boolean;
    size: OverlaySize;
    position: OverlayPosition;
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
    size: 'md', 
    position: 'bottom-left', 
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