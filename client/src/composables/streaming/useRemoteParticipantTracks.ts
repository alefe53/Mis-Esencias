// RUTA: src/composables/streaming/useRemoteParticipantTracks.ts

import { shallowRef, watch, onUnmounted, type Ref } from 'vue';
import { ParticipantEvent, Track, type RemoteParticipant, type TrackPublication } from 'livekit-client';

export function useRemoteParticipantTracks(participant: Ref<RemoteParticipant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const screenSharePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = (p: RemoteParticipant | null) => {
    if (!p) {
      cameraPublication.value = null;
      screenSharePublication.value = null;
      return;
    }
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
    screenSharePublication.value = p.getTrackPublication(Track.Source.ScreenShare) ?? null;
  };

  // Esta función se activará cuando el admin publique o despublique un track
  const onPublicationsChanged = () => {
    if(participant.value) {
        updatePublications(participant.value);
    }
  }

  // Esta función se activará cuando el admin apague/prenda su cámara (mute/unmute)
   const onMutedChanged = () => {
    // Cuando el estado de mute cambia, simplemente volvemos a ejecutar
    // nuestra función principal de actualización.
    // Esto asegura que cualquier componente que dependa de `cameraPublication`
    // reciba el objeto actualizado directamente desde el SDK, sin crear copias inválidas.
    if (participant.value) {
        updatePublications(participant.value);
    }
  }
  watch(participant, (newP, oldP) => {
    if (oldP) {
      // Limpiamos los listeners del participante anterior
      oldP.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackMuted, onMutedChanged);
      oldP.off(ParticipantEvent.TrackUnmuted, onMutedChanged);
    }
    if (newP) {
      // Nos suscribimos a los eventos correctos del nuevo participante
      newP.on(ParticipantEvent.TrackPublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackMuted, onMutedChanged);
      newP.on(ParticipantEvent.TrackUnmuted, onMutedChanged);
    }
    updatePublications(newP);
  }, { immediate: true });

  onUnmounted(() => {
    const p = participant.value;
    if (p) {
      p.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      p.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      p.off(ParticipantEvent.TrackMuted, onMutedChanged);
      p.off(ParticipantEvent.TrackUnmuted, onMutedChanged);
    }
  });

  return {
    cameraPublication,
    screenSharePublication,
  };
}