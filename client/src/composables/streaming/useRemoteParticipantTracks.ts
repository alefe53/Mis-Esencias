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
    // Obtenemos las publicaciones actuales
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
    screenSharePublication.value = p.getTrackPublication(Track.Source.ScreenShare) ?? null;
  };

  const onTrackSubscribed = (_track: any, publication: TrackPublication) => {
    // Cuando un track se suscribe, lo actualizamos para asegurar la reactividad
    if (publication.source === Track.Source.Camera) {
        cameraPublication.value = publication;
    } else if (publication.source === Track.Source.ScreenShare) {
        screenSharePublication.value = publication;
    }
  };
  
  const onTrackUnsubscribed = (_track: any, publication: TrackPublication) => {
      if (publication.source === Track.Source.Camera) {
          cameraPublication.value = null;
      } else if (publication.source === Track.Source.ScreenShare) {
          screenSharePublication.value = null;
      }
  };

  // Observamos si el participante cambia (por ejemplo, de null a un participante real)
  watch(participant, (newP, oldP) => {
    if (oldP) {
      oldP.off(ParticipantEvent.TrackSubscribed, onTrackSubscribed);
      oldP.off(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed);
    }
    if (newP) {
      // Nos suscribimos a los eventos del nuevo participante
      newP.on(ParticipantEvent.TrackSubscribed, onTrackSubscribed);
      newP.on(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed);
    }
    // Actualizamos las publicaciones inmediatamente
    updatePublications(newP);
  }, { immediate: true });

  onUnmounted(() => {
    const p = participant.value;
    if (p) {
      p.off(ParticipantEvent.TrackSubscribed, onTrackSubscribed);
      p.off(ParticipantEvent.TrackUnsubscribed, onTrackUnsubscribed);
    }
  });

  return {
    cameraPublication,
    screenSharePublication,
  };
}