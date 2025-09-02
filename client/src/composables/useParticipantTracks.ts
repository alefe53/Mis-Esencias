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

  const updateState = () => {
    if (!participant.value) return

    // Obtiene las publicaciones de tracks actuales
    cameraTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Camera) ?? null
    screenShareTrackPub.value =
      participant.value.getTrackPublication(Track.Source.ScreenShare) ?? null
    audioTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Microphone) ?? null
  }

  const onTrackUpdated = () => {
    updateState()
  }

  watch(
    participant,
    (newP, oldP) => {
      if (oldP) {
        oldP.off(ParticipantEvent.TrackPublished, onTrackUpdated)
        oldP.off(ParticipantEvent.TrackUnpublished, onTrackUpdated)
        oldP.off(ParticipantEvent.TrackMuted, onTrackUpdated)
        oldP.off(ParticipantEvent.TrackUnmuted, onTrackUpdated)
      }
      if (newP) {
        updateState()
        newP.on(ParticipantEvent.TrackPublished, onTrackUpdated)
        newP.on(ParticipantEvent.TrackUnpublished, onTrackUpdated)
        newP.on(ParticipantEvent.TrackMuted, onTrackUpdated)
        newP.on(ParticipantEvent.TrackUnmuted, onTrackUpdated)
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onTrackUpdated)
      participant.value.off(ParticipantEvent.TrackUnpublished, onTrackUpdated)
      participant.value.off(ParticipantEvent.TrackMuted, onTrackUpdated)
      participant.value.off(ParticipantEvent.TrackUnmuted, onTrackUpdated)
    }
  })

  return {
    cameraTrackPub,
    screenShareTrackPub,
    audioTrackPub,
  }
}