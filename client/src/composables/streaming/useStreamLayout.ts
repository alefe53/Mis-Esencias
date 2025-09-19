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

    console.log('[useStreamLayout] -> 🤔 Recalculando main view:', {
        isScreenSharing,
        isCameraFocus,
        cameraHasTrack: publicationHasActiveTrack(camera.value),
        screenHasTrack: publicationHasActiveTrack(screen.value)
    });

    // REGLA 1: El foco en la cámara siempre tiene la máxima prioridad.
    if (isCameraFocus && publicationHasActiveTrack(camera.value)) {
      return camera.value;
    }

    // ▼▼▼ LÓGICA CORREGIDA Y MÁS ESTRICTA ▼▼▼

    // REGLA 2: Si estamos en modo "Compartir Pantalla".
    if (isScreenSharing) {
      // La vista principal DEBE ser la pantalla si el track está listo.
      if (publicationHasActiveTrack(screen.value)) {
        return screen.value;
      }
      // IMPORTANTE: Si el track de la pantalla aún no llega, no mostramos NADA en la vista principal.
      // NO hay fallback a la cámara aquí. Esto previene la duplicación.
      return null;
    }
    
    // REGLA 3: Si no se está compartiendo pantalla (modo normal).
    // La vista principal es la cámara si está disponible.
    if (publicationHasActiveTrack(camera.value)) {
      return camera.value;
    }
    
    // Fallback final si no hay nada que mostrar.
    return null;
  });

  const overlayViewPublication = computed(() => {
    const layoutState = layoutStateRef.value;
    const { isScreenSharing, isCameraFocus } = layoutState;
    const { camera } = publications;

    // La lógica del overlay se mantiene, es correcta.
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