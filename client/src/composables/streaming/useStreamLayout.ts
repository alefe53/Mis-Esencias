// RUTA: src/composables/streaming/useStreamLayout.ts

import { computed, type Ref, type ShallowRef } from 'vue'; // Asegúrate de que Ref esté importado
import type { TrackPublication } from 'livekit-client';

interface LayoutState {
  isScreenSharing: boolean;
  isCameraFocus: boolean;
  isCameraEnabled?: boolean;
}

interface Publications {
  camera: ShallowRef<TrackPublication | null>;
  screen: ShallowRef<TrackPublication | null>;
}

//                       👇 CAMBIO 1: Aceptamos una Ref<LayoutState>
export function useStreamLayout(
  layoutStateRef: Ref<LayoutState>, 
  publications: Publications
) {
  
  const mainViewPublication = computed(() => {
    const layoutState = layoutStateRef.value; // 👈 CAMBIO 2: "Abrimos la caja" aquí
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera, screen } = publications;

    if (isCameraFocus && camera.value) {
      return camera.value;
    }

    if (isScreenSharing && screen.value) {
      return screen.value;
    }

    if (camera.value) {
      return camera.value;
    }
    
    return null;
  });

  const overlayViewPublication = computed(() => {
    const layoutState = layoutStateRef.value; // 👈 CAMBIO 2: "Abrimos la caja" aquí
    const { isScreenSharing, isCameraFocus, isCameraEnabled } = layoutState;
    const { camera } = publications;

    const shouldShow = isScreenSharing && !isCameraFocus && isCameraEnabled && camera.value;

    return shouldShow ? camera.value : null;
  });

  const showOverlay = computed(() => !!overlayViewPublication.value);

  return {
    mainViewPublication,
    overlayViewPublication,
    showOverlay,
  };
}