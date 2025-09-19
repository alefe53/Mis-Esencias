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

    console.debug('[ViewerTracks] -> 🔄 Publicaciones actualizadas:', {
      participant: p.identity,
      camera: cameraPublication.value ? { sid: cameraPublication.value.trackSid, hasTrack: !!cameraPublication.value.track } : null,
      screen: screenSharePublication.value ? { sid: screenSharePublication.value.trackSid, hasTrack: !!screenSharePublication.value.track } : null
    });
  };

  const onTrackStateChanged = () => {
    console.log('[ViewerTracks] -> 👂 Evento de track detectado (Published, Subscribed, Muted, etc). Re-evaluando...');
    if (participant.value) {
      updatePublications(participant.value);
    }
  };

  watch(participant, (newP, oldP) => {
    if (oldP) {
      oldP.off(ParticipantEvent.TrackPublished, onTrackStateChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onTrackStateChanged);
      oldP.off(ParticipantEvent.TrackMuted, onTrackStateChanged);
      oldP.off(ParticipantEvent.TrackUnmuted, onTrackStateChanged);
      oldP.off(ParticipantEvent.TrackSubscribed, onTrackStateChanged);
      oldP.off(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged);
    }
    if (newP) {
      newP.on(ParticipantEvent.TrackPublished, onTrackStateChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onTrackStateChanged);
      newP.on(ParticipantEvent.TrackMuted, onTrackStateChanged);
      newP.on(ParticipantEvent.TrackUnmuted, onTrackStateChanged);
      newP.on(ParticipantEvent.TrackSubscribed, onTrackStateChanged);
      newP.on(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged);
    }
    updatePublications(newP);
  }, { immediate: true });

  onUnmounted(() => {
    if (participant.value) {
        onTrackStateChanged(); // Re-assign with empty participant
    }
  });

  return {
    cameraPublication,
    screenSharePublication,
  };
}