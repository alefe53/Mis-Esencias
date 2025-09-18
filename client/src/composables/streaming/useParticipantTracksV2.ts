// RUTA: src/composables/streaming/useParticipantTracksV2.ts
import { shallowRef, watch, type Ref, onUnmounted } from 'vue';
import { ParticipantEvent, Track, type Participant, type TrackPublication } from 'livekit-client';

export function useParticipantTracksV2(participant: Ref<Participant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const microphonePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    if (!participant.value) {
      cameraPublication.value = null;
      microphonePublication.value = null;
      return;
    }
    cameraPublication.value = participant.value.getTrackPublication(Track.Source.Camera) ?? null;
    microphonePublication.value = participant.value.getTrackPublication(Track.Source.Microphone) ?? null;
  };

  const onPublicationsChanged = () => {
    updatePublications();
  };

  watch(participant, (newP, oldP) => {
    if (oldP) {
      // Limpiamos todos los listeners del participante anterior
      oldP.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackSubscribed, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackUnsubscribed, onPublicationsChanged);
    }
    if (newP) {
      // Añadimos TODOS los listeners necesarios al nuevo participante
      newP.on(ParticipantEvent.TrackPublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackSubscribed, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackUnsubscribed, onPublicationsChanged);
      updatePublications(); // Hacemos una actualización inicial
    }
  }, { immediate: true });

  onUnmounted(() => {
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      participant.value.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      participant.value.off(ParticipantEvent.TrackSubscribed, onPublicationsChanged);
      participant.value.off(ParticipantEvent.TrackUnsubscribed, onPublicationsChanged);
    }
  });

  return {
    cameraPublication,
    microphonePublication,
  };
}