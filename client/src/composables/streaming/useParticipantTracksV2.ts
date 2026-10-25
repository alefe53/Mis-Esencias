// RUTA: src/composables/streaming/useParticipantTracksV2.ts

import { shallowRef, watch, type Ref, onUnmounted } from 'vue'
import {
  ParticipantEvent,
  Track,
  type LocalParticipant,
  type TrackPublication,
} from 'livekit-client'

// Cambiamos el tipo de Participant a LocalParticipant para ser más específicos
export function useParticipantTracksV2(
  participant: Ref<LocalParticipant | null>,
) {
  const cameraPublication = shallowRef<TrackPublication | null>(null)
  const microphonePublication = shallowRef<TrackPublication | null>(null)
  const screenSharePublication = shallowRef<TrackPublication | null>(null)

  // La función de actualización se mantiene igual
  const updatePublications = (p: LocalParticipant | null) => {
    console.log(
      `[useParticipantTracksV2] -> 🔄 Actualizando publicaciones para: ${p?.identity ?? 'nadie'}`,
    )
    if (!p) {
      cameraPublication.value = null
      microphonePublication.value = null
      screenSharePublication.value = null
      return
    }

    // Usamos getTrackPublication para obtener el estado MÁS RECIENTE del SDK
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null
    microphonePublication.value =
      p.getTrackPublication(Track.Source.Microphone) ?? null
    screenSharePublication.value =
      p.getTrackPublication(Track.Source.ScreenShare) ?? null

    console.log('[useParticipantTracksV2] -> ✅ Publicaciones actualizadas:', {
      cam: cameraPublication.value
        ? `Publicado (SID: ${cameraPublication.value.trackSid})`
        : 'No',
      mic: microphonePublication.value
        ? `Publicado (SID: ${microphonePublication.value.trackSid})`
        : 'No',
      screen: screenSharePublication.value
        ? `Publicado (SID: ${screenSharePublication.value.trackSid})`
        : 'No',
    })
  }

  // ✅ NUEVA FUNCIÓN HANDLER: Se llamará CADA VEZ que LiveKit publique o despublique un track local.
  const onLocalTrackChanged = (publication: TrackPublication) => {
    console.log(
      `[useParticipantTracksV2] -> 👂 Evento LocalTrack... detectado! Fuente: ${publication.source}. Re-evaluando todas las publicaciones.`,
    )
    // Simplemente volvemos a ejecutar la función de actualización.
    // Esto asegura que nuestro estado local (los shallowRefs) siempre coincida con el del SDK.
    updatePublications(participant.value)
  }

  // ✅ LÓGICA DE WATCH MEJORADA
  watch(
    participant,
    (newP, oldP) => {
      // Si había un participante anterior, nos damos de baja de sus eventos para evitar memory leaks.
      if (oldP) {
        console.log(
          `[useParticipantTracksV2] -> 🧹 Limpiando listeners del participante anterior: ${oldP.identity}`,
        )
        oldP.off(ParticipantEvent.LocalTrackPublished, onLocalTrackChanged)
        oldP.off(ParticipantEvent.LocalTrackUnpublished, onLocalTrackChanged)
      }

      // Si hay un nuevo participante, nos suscribimos a sus eventos.
      if (newP) {
        console.log(
          `[useParticipantTracksV2] -> 🔗 Suscribiendo listeners al nuevo participante: ${newP.identity}`,
        )
        newP.on(ParticipantEvent.LocalTrackPublished, onLocalTrackChanged)
        newP.on(ParticipantEvent.LocalTrackUnpublished, onLocalTrackChanged)
      }

      // Finalmente, ejecutamos una actualización inicial con el nuevo participante.
      updatePublications(newP)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    console.log(
      '[useParticipantTracksV2] ->  componente desmontado. Limpiando listeners...',
    )
    const p = participant.value
    if (p) {
      p.off(ParticipantEvent.LocalTrackPublished, onLocalTrackChanged)
      p.off(ParticipantEvent.LocalTrackUnpublished, onLocalTrackChanged)
    }
  })

  return {
    cameraPublication,
    microphonePublication,
    screenSharePublication,
  }
}
