// RUTA: src/composables/streaming/useStreamLayout.ts

import { computed, type Ref, type ShallowRef } from 'vue';
import type { TrackPublication } from 'livekit-client';

interface LayoutState {
  isScreenSharing: boolean;
  isCameraFocus: boolean;
}

interface Publications {
  camera: ShallowRef<TrackPublication | null>;
  screen: ShallowRef<TrackPublication | null>;
}

/**
 * Helper que determina si una publicación tiene un track listo para ser mostrado.
 * La clave es `publication.track`, que el SDK rellena una vez suscrito.
 */
function publicationHasActiveTrack(pub: TrackPublication | null): boolean {
  return !!pub?.track;
}

export function useStreamLayout(
  layoutStateRef: Ref<LayoutState>, 
  publications: Publications
) {
  
  const mainViewPublication = computed(() => {
    const layoutState = layoutStateRef.value;
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera, screen } = publications;

    // Log de decisión para depuración
    console.log('[useStreamLayout] -> 🤔 Recalculando main view:', {
        isScreenSharing,
        isCameraFocus,
        cameraHasTrack: publicationHasActiveTrack(camera.value),
        screenHasTrack: publicationHasActiveTrack(screen.value)
    });

    // Si la cámara es el foco y tiene un track activo, es la principal.
    if (isCameraFocus && publicationHasActiveTrack(camera.value)) {
      return camera.value;
    }

    // Si se comparte pantalla y tiene un track activo, es la principal.
    if (isScreenSharing && publicationHasActiveTrack(screen.value)) {
      return screen.value;
    }

    // Como fallback, si la cámara tiene un track activo, se muestra.
    if (publicationHasActiveTrack(camera.value)) {
      return camera.value;
    }
    
    // Si nada tiene un track activo, no se muestra nada.
    return null;
  });

  const overlayViewPublication = computed(() => {
    const layoutState = layoutStateRef.value;
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera } = publications;

    // El overlay (cámara) se muestra si:
    // 1. Se está compartiendo pantalla.
    // 2. La cámara NO es el foco.
    // 3. La publicación de la cámara tiene un track activo.
    const shouldShow = isScreenSharing && !isCameraFocus && publicationHasActiveTrack(camera.value);

    return shouldShow ? camera.value : null;
  });

  const showOverlay = computed(() => !!overlayViewPublication.value);

  return {
    mainViewPublication,
    overlayViewPublication,
    showOverlay,
  };
}