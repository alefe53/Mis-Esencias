// RUTA: src/composables/streaming/useStreamLayout.ts

import { computed, type Ref, type ShallowRef } from 'vue'
import type { TrackPublication } from 'livekit-client'

interface LayoutState {
  isScreenSharing: boolean
  isCameraFocus: boolean
}

interface Publications {
  camera: ShallowRef<TrackPublication | null>
  screen: ShallowRef<TrackPublication | null>
}

/**
 * Helper: determina si una publicación tiene un track listo para attach.
 */
function publicationHasActiveTrack(pub: TrackPublication | null): boolean {
  return !!(pub && (pub.track || (pub as any).isSubscribed))
}

/**
 * Helper: obtiene el trackSid de una publicación para poder compararlas.
 */
function getTrackSid(pub: TrackPublication | null): string | null {
  return pub?.trackSid ?? null
}

export function useStreamLayout(
  layoutStateRef: Ref<LayoutState>,
  publications: Publications,
) {
  const mainViewPublication = computed(() => {
    const layoutState = layoutStateRef.value
    const { isScreenSharing, isCameraFocus } = layoutState
    const { camera, screen } = publications

    const camHasTrack = publicationHasActiveTrack(camera.value)
    const screenHasTrack = publicationHasActiveTrack(screen.value)

    // REGLA 1: El foco en la cámara tiene máxima prioridad.
    if (isCameraFocus && camHasTrack) {
      return camera.value
    }

    // REGLA 2: Si estamos compartiendo pantalla.
    if (isScreenSharing) {
      // a) Si la pantalla está lista, es la principal.
      if (screenHasTrack) {
        return screen.value
      }
      // b) Si la pantalla aún no llega, hacemos un fallback a la cámara para mejorar la UX
      //    y evitar un placeholder vacío, siempre que la cámara esté disponible.
      if (camHasTrack) {
        console.log(
          '[useStreamLayout] -> Fallback: screen share activo pero track no disponible. Mostrando cámara temporalmente.',
        )
        return camera.value
      }
      // Si ni la pantalla ni la cámara están listas, no mostramos nada.
      return null
    }

    // REGLA 3: Modo normal (sin compartir pantalla), la cámara es la principal si está lista.
    if (camHasTrack) {
      return camera.value
    }

    return null
  })

  const overlayViewPublication = computed(() => {
    const { isScreenSharing, isCameraFocus } = layoutStateRef.value
    const { camera } = publications

    const camHasTrack = publicationHasActiveTrack(camera.value)
    const mainPub = mainViewPublication.value // Usamos la publicación principal ya calculada.

    // REGLA DEL OVERLAY:
    // 1. Debe estar activo el modo de compartir pantalla.
    // 2. La cámara NO debe ser el foco principal.
    // 3. La cámara debe tener un track activo.
    const shouldShow = isScreenSharing && !isCameraFocus && camHasTrack

    if (!shouldShow) {
      return null
    }

    // REGLA ANTI-DUPLICACIÓN:
    // Comparamos el SID del track del overlay con el de la vista principal.
    // Si son iguales, NO mostramos el overlay para evitar duplicados.
    if (getTrackSid(camera.value) === getTrackSid(mainPub)) {
      console.warn(
        '[useStreamLayout] -> ⚠️ Detectado intento de duplicación. Anulando overlay porque es el mismo track que la vista principal.',
      )
      return null
    }

    return camera.value
  })

  const showOverlay = computed(() => !!overlayViewPublication.value)

  return {
    mainViewPublication,
    overlayViewPublication,
    showOverlay,
  }
}
