// RUTA: src/composables/streaming/useParticipantTracksV2.ts
import { shallowRef, watch, type Ref, onUnmounted } from 'vue';
import { ParticipantEvent, Track, type Participant, type TrackPublication } from 'livekit-client';

export function useParticipantTracksV2(participant: Ref<Participant | null>) {
  // Usamos shallowRef porque los objetos de LiveKit no deben ser reactivos en profundidad.
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const microphonePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    if (!participant.value) {
      cameraPublication.value = null;
      microphonePublication.value = null;
      return;
    }
    // Buscamos las publicaciones existentes cuando el participante cambia.
    cameraPublication.value = participant.value.getTrackPublication(Track.Source.Camera) ?? null;
    microphonePublication.value = participant.value.getTrackPublication(Track.Source.Microphone) ?? null;
  };

  // Esta función se llamará cada vez que el participante publique o despublique un track.
  const onPublicationsChanged = () => {
    updatePublications();
  };

  watch(participant, (newP, oldP) => {
    if (oldP) {
      oldP.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
    }
    if (newP) {
      newP.on(ParticipantEvent.TrackPublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      // Hacemos una actualización inicial.
      updatePublications();
    }
  }, { immediate: true });

  onUnmounted(() => {
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      participant.value.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
    }
  });

  return {
    cameraPublication,
    microphonePublication,
  };
}