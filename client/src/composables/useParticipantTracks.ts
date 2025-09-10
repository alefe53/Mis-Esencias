import { watch, onUnmounted, shallowRef, type Ref } from 'vue';
import {
  type Participant,
  type TrackPublication,
  Track,
  ParticipantEvent,
} from 'livekit-client';

export function useParticipantTracks(participant: Ref<Participant | null>) {
  // ✅ CAMBIO CLAVE: Usamos shallowRef en lugar de ref.
  // Esto previene que Vue "desarme" el objeto TrackPublication y conserve su tipo original.
  const cameraTrackPub = shallowRef<TrackPublication | null>(null);
  const screenShareTrackPub = shallowRef<TrackPublication | null>(null);
  const audioTrackPub = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    if (!participant.value) {
      cameraTrackPub.value = null;
      screenShareTrackPub.value = null;
      audioTrackPub.value = null;
      return;
    }

    cameraTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Camera) ?? null;
    screenShareTrackPub.value =
      participant.value.getTrackPublication(Track.Source.ScreenShare) ?? null;
    audioTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Microphone) ?? null;
  };

  const onTracksChanged = () => {
    updatePublications();
  };

  watch(
    participant,
    (newP, oldP) => {
      if (oldP) {
        oldP.off(ParticipantEvent.TrackPublished, onTracksChanged);
        oldP.off(ParticipantEvent.TrackUnpublished, onTracksChanged);
        oldP.off(ParticipantEvent.TrackSubscribed, onTracksChanged);
        oldP.off(ParticipantEvent.TrackUnsubscribed, onTracksChanged);
        oldP.off(ParticipantEvent.TrackMuted, onTracksChanged);
        oldP.off(ParticipantEvent.TrackUnmuted, onTracksChanged);
      }
      if (newP) {
        updatePublications();
        newP.on(ParticipantEvent.TrackPublished, onTracksChanged);
        newP.on(ParticipantEvent.TrackUnpublished, onTracksChanged);
        newP.on(ParticipantEvent.TrackSubscribed, onTracksChanged);
        newP.on(ParticipantEvent.TrackUnsubscribed, onTracksChanged);
        newP.on(ParticipantEvent.TrackMuted, onTracksChanged);
        newP.on(ParticipantEvent.TrackUnmuted, onTracksChanged);
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onTracksChanged);
      participant.value.off(ParticipantEvent.TrackUnpublished, onTracksChanged);
      participant.value.off(ParticipantEvent.TrackSubscribed, onTracksChanged);
      participant.value.off(ParticipantEvent.TrackUnsubscribed, onTracksChanged);
      participant.value.off(ParticipantEvent.TrackMuted, onTracksChanged);
      participant.value.off(ParticipantEvent.TrackUnmuted, onTracksChanged);
    }
  });

  return {
    cameraTrackPub,
    screenShareTrackPub,
    audioTrackPub,
  };
}