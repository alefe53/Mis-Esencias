// RUTA: src/composables/streaming/useRemoteParticipantTracks.ts

import { shallowRef, watch, onUnmounted, type Ref } from 'vue'
import {
  ParticipantEvent,
  Track,
  type RemoteParticipant,
  type TrackPublication,
} from 'livekit-client'

export function useRemoteParticipantTracks(
  participant: Ref<RemoteParticipant | null>,
) {
  const cameraPublication = shallowRef<TrackPublication | null>(null)
  const screenSharePublication = shallowRef<TrackPublication | null>(null)

  // ▼▼▼ NUESTRAS BANDERAS REACTIVAS ▼▼▼
  // Estas son simples booleanos que Vue SÍ entenderá cuando cambien.
  const cameraReady = shallowRef<boolean>(false)
  const screenReady = shallowRef<boolean>(false)

  const updatePublications = (p: RemoteParticipant | null) => {
    if (!p) {
      // Limpiamos todo si el participante se desconecta
      cameraPublication.value = null
      screenSharePublication.value = null
      cameraReady.value = false
      screenReady.value = false
      return
    }

    const camPub = p.getTrackPublication(Track.Source.Camera) ?? null
    const scrPub = p.getTrackPublication(Track.Source.ScreenShare) ?? null

    cameraPublication.value = camPub
    screenSharePublication.value = scrPub

    // Actualizamos nuestras banderas basándonos en si el track REAL existe.
    // Esta es la única verdad que importa.
    const newCameraReady = !!camPub?.track
    const newScreenReady = !!scrPub?.track

    // Solo actualizamos y logueamos si el estado realmente cambió para evitar ruido.
    if (cameraReady.value !== newCameraReady) {
      cameraReady.value = newCameraReady
      console.log(
        `[ViewerTracks] -> 🟢 Camera Ready cambió a: ${cameraReady.value}`,
      )
    }
    if (screenReady.value !== newScreenReady) {
      screenReady.value = newScreenReady
      console.log(
        `[ViewerTracks] -> 🖥️ Screen Ready cambió a: ${screenReady.value}`,
      )
    }
  }

  // Un único handler para todos los eventos que puedan afectar el estado de los tracks
  const onTrackStateChanged = () => {
    console.log(
      '[ViewerTracks] -> 👂 Evento de track detectado. Re-evaluando publicaciones...',
    )
    if (participant.value) {
      updatePublications(participant.value)
    }
  }

  // Observamos cambios en el participante (cuando se conecta o desconecta)
  watch(
    participant,
    (newP, oldP) => {
      if (oldP) {
        // Limpiamos listeners del participante anterior para evitar fugas de memoria
        oldP.off(ParticipantEvent.TrackPublished, onTrackStateChanged)
        oldP.off(ParticipantEvent.TrackUnpublished, onTrackStateChanged)
        oldP.off(ParticipantEvent.TrackSubscribed, onTrackStateChanged)
        oldP.off(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged)
      }
      if (newP) {
        // Nos suscribimos a todos los eventos relevantes del nuevo participante
        newP.on(ParticipantEvent.TrackPublished, onTrackStateChanged)
        newP.on(ParticipantEvent.TrackUnpublished, onTrackStateChanged)
        newP.on(ParticipantEvent.TrackSubscribed, onTrackStateChanged)
        newP.on(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged)
      }
      // Actualizamos el estado inicial
      updatePublications(newP)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    // Limpieza final
    const p = participant.value
    if (p) {
      p.off(ParticipantEvent.TrackPublished, onTrackStateChanged)
      p.off(ParticipantEvent.TrackUnpublished, onTrackStateChanged)
      p.off(ParticipantEvent.TrackSubscribed, onTrackStateChanged)
      p.off(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged)
    }
  })

  return {
    cameraPublication,
    screenSharePublication,
    // Exportamos nuestras nuevas y fiables banderas
    cameraReady,
    screenReady,
  }
}
