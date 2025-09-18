// RUTA: src/composables/streaming/useParticipantTracksV2.ts
import { shallowRef, watch, type Ref, onUnmounted } from 'vue';
import { ParticipantEvent, Track, type Participant, type TrackPublication } from 'livekit-client';
import { appEmitter } from '../../utils/eventEmitter';

export function useParticipantTracksV2(participant: Ref<Participant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const microphonePublication = shallowRef<TrackPublication | null>(null);
  const screenSharePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    const p = participant.value;
    console.log(`[useParticipantTracks] -> 🔄 Executing updatePublications for participant: ${p?.identity}`);
    if (!p) {
      cameraPublication.value = null;
      microphonePublication.value = null;
      screenSharePublication.value = null; 
      return;
    }
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
    microphonePublication.value = p.getTrackPublication(Track.Source.Microphone) ?? null;
    screenSharePublication.value = p.getTrackPublication(Track.Source.ScreenShare) ?? null;

    console.log('[useParticipantTracks] -> ✅ Done updating.', { 
      cam: cameraPublication.value, 
      mic: microphonePublication.value,
      screen: screenSharePublication.value,
    });
  };

  const onPublicationsChanged = (pub: TrackPublication) => {
    console.log('[useParticipantTracks] -> 👂 Participant event detected!', pub);
    updatePublications();
  };

  watch(participant, (newP) => {
    if (newP) {
      console.log(`[useParticipantTracks] -> 👂 Subscribing to 'local-track-changed' for participant ${newP.identity}`);
      appEmitter.on('local-track-changed', updatePublications);
      updatePublications(); 
    }
  }, { immediate: true });

  onUnmounted(() => {
    console.log('[useParticipantTracks] 🧹 Unmounting. Unsubscribing from emitter.');
    appEmitter.off('local-track-changed', updatePublications);
  });

  return {
    cameraPublication,
    microphonePublication,
    screenSharePublication, 
    updatePublications, 
  };
}