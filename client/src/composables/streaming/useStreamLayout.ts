// RUTA: src/composables/streaming/useStreamLayout.ts

import { computed, type Ref, type ShallowRef } from 'vue';
import type { TrackPublication } from 'livekit-client';

interface LayoutState {
  isScreenSharing: boolean;
  isCameraFocus: boolean;
  // Ya no necesitamos isCameraEnabled aquí para la lógica del layout
}

interface Publications {
  camera: ShallowRef<TrackPublication | null>;
  screen: ShallowRef<TrackPublication | null>;
}

export function useStreamLayout(
  layoutStateRef: Ref<LayoutState>, 
  publications: Publications
) {
  
  const mainViewPublication = computed(() => {
    const layoutState = layoutStateRef.value;
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera, screen } = publications;

    // Si la cámara es el foco, siempre se muestra la cámara
    if (isCameraFocus && camera.value) {
      return camera.value;
    }

    // Si se comparte pantalla (y no hay foco en cámara), se muestra la pantalla
    if (isScreenSharing && screen.value) {
      return screen.value;
    }

    // Por defecto, o si no se comparte pantalla, se muestra la cámara
    if (camera.value) {
      return camera.value;
    }
    
    return null;
  });

  const overlayViewPublication = computed(() => {
    const layoutState = layoutStateRef.value;
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera } = publications;

    // ▼▼▼ LÓGICA CORREGIDA ▼▼▼
    // El overlay se muestra si:
    // 1. Estás compartiendo pantalla.
    // 2. La cámara NO es el foco principal.
    // 3. Existe una publicación de cámara (incluso si está muteada).
    const shouldShow = isScreenSharing && !isCameraFocus && camera.value;

    return shouldShow ? camera.value : null;
  });

  const showOverlay = computed(() => !!overlayViewPublication.value);

  return {
    mainViewPublication,
    overlayViewPublication,
    showOverlay,
  };
}