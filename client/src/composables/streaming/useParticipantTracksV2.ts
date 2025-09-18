// RUTA: src/composables/streaming/useParticipantTracksV2.ts
import { shallowRef, watch, type Ref, onUnmounted } from 'vue';
import { ParticipantEvent, Track, type Participant, type TrackPublication } from 'livekit-client';

export function useParticipantTracksV2(participant: Ref<Participant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const microphonePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    const p = participant.value;
    // 🪵 LOG: Actualizando publicaciones
    console.log(`[useParticipantTracks] -> Updating publications for participant: ${p?.identity}`);
    if (!p) {
      cameraPublication.value = null;
      microphonePublication.value = null;
      return;
    }
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
    microphonePublication.value = p.getTrackPublication(Track.Source.Microphone) ?? null;
    console.log('[useParticipantTracks] -> ✅ Done updating.', { cam: cameraPublication.value, mic: microphonePublication.value });
  };

  watch(participant, (newP, oldP) => {
    // 🪵 LOG: El participante ha cambiado, reconfigurando listeners.
    console.log(`[useParticipantTracks] 👂 Participant watcher fired. New: ${newP?.identity}, Old: ${oldP?.identity}`);
    if (oldP) {
      oldP.off(ParticipantEvent.TrackPublished, updatePublications);
      oldP.off(ParticipantEvent.TrackUnpublished, updatePublications);
      oldP.off(ParticipantEvent.TrackSubscribed, updatePublications);
      oldP.off(ParticipantEvent.TrackUnsubscribed, updatePublications);
    }
    if (newP) {
      newP.on(ParticipantEvent.TrackPublished, updatePublications);
      newP.on(ParticipantEvent.TrackUnpublished, updatePublications);
      newP.on(ParticipantEvent.TrackSubscribed, updatePublications);
      newP.on(ParticipantEvent.TrackUnsubscribed, updatePublications);
      updatePublications(); // Actualización inicial
    }
  }, { immediate: true });

  onUnmounted(() => {
    // 🪵 LOG: Desmontando el composable.
    console.log('[useParticipantTracks] 🧹 Unmounting. Cleaning up listeners.');
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, updatePublications);
      participant.value.off(ParticipantEvent.TrackUnpublished, updatePublications);
      participant.value.off(ParticipantEvent.TrackSubscribed, updatePublications);
      participant.value.off(ParticipantEvent.TrackUnsubscribed, updatePublications);
    }
  });

  return {
    cameraPublication,
    microphonePublication,
  };
}