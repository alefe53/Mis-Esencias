// RUTA: src/composables/useParticipantTracks.ts

import { ref, watch, onUnmounted, type Ref } from 'vue'
import {
  type Participant,
  type TrackPublication,
  Track,
  ParticipantEvent,
} from 'livekit-client'

export function useParticipantTracks(participant: Ref<Participant | null>) {
  const cameraTrackPub = ref<TrackPublication | null>(null)
  const screenShareTrackPub = ref<TrackPublication | null>(null)
  const audioTrackPub = ref<TrackPublication | null>(null)

  const updatePublications = () => {
    if (!participant.value) {
      cameraTrackPub.value = null
      screenShareTrackPub.value = null
      audioTrackPub.value = null
      return
    }

    // Usamos getTrackPublication para obtener el estado actual de las publicaciones.
    // Esto es fiable y nos da el estado más reciente.
    cameraTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Camera) ?? null
    screenShareTrackPub.value =
      participant.value.getTrackPublication(Track.Source.ScreenShare) ?? null
    audioTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Microphone) ?? null
  }

  // Un solo handler para todos los eventos que indican un cambio en los tracks.
  // Esto simplifica la lógica y evita redundancia.
  const onTracksChanged = () => {
    updatePublications()
  }

  watch(
    participant,
    (newP, oldP) => {
      if (oldP) {
        // Limpiamos todos los listeners del participante anterior para evitar fugas de memoria.
        oldP.off(ParticipantEvent.TrackPublished, onTracksChanged)
        oldP.off(ParticipantEvent.TrackUnpublished, onTracksChanged)
        oldP.off(ParticipantEvent.TrackSubscribed, onTracksChanged)
        oldP.off(ParticipantEvent.TrackUnsubscribed, onTracksChanged)
        oldP.off(ParticipantEvent.TrackMuted, onTracksChanged)
        oldP.off(ParticipantEvent.TrackUnmuted, onTracksChanged)
      }
      if (newP) {
        // Actualizamos el estado inicial para el nuevo participante.
        updatePublications()
        // Nos suscribimos a todos los eventos relevantes.
        newP.on(ParticipantEvent.TrackPublished, onTracksChanged)
        newP.on(ParticipantEvent.TrackUnpublished, onTracksChanged)
        newP.on(ParticipantEvent.TrackSubscribed, onTracksChanged)
        newP.on(ParticipantEvent.TrackUnsubscribed, onTracksChanged)
        newP.on(ParticipantEvent.TrackMuted, onTracksChanged)
        newP.on(ParticipantEvent.TrackUnmuted, onTracksChanged)
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onTracksChanged)
        participant.value.off(ParticipantEvent.TrackUnpublished, onTracksChanged)
        participant.value.off(ParticipantEvent.TrackSubscribed, onTracksChanged)
        participant.value.off(ParticipantEvent.TrackUnsubscribed, onTracksChanged)
        participant.value.off(ParticipantEvent.TrackMuted, onTracksChanged)
        participant.value.off(ParticipantEvent.TrackUnmuted, onTracksChanged)
    }
  })

  return {
    cameraTrackPub,
    screenShareTrackPub,
    audioTrackPub,
  }
}