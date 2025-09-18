// RUTA: src/composables/streaming/useParticipantTracksV2.ts
import { shallowRef, watch, type Ref, onUnmounted } from 'vue';
import { ParticipantEvent, Track, type Participant, type TrackPublication } from 'livekit-client';

export function useParticipantTracksV2(participant: Ref<Participant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const microphonePublication = shallowRef<TrackPublication | null>(null);
  // ❗️ NUEVO: Creamos una ref para la publicación de la pantalla
  const screenSharePublication = shallowRef<TrackPublication | null>(null);

  const updatePublications = () => {
    const p = participant.value;
    console.log(`[useParticipantTracks] -> 🔄 Executing updatePublications for participant: ${p?.identity}`);
    if (!p) {
      cameraPublication.value = null;
      microphonePublication.value = null;
      screenSharePublication.value = null; // ❗️ NUEVO: Limpiamos también esta ref
      return;
    }
    cameraPublication.value = p.getTrackPublication(Track.Source.Camera) ?? null;
    microphonePublication.value = p.getTrackPublication(Track.Source.Microphone) ?? null;
    // ❗️ NUEVO: Buscamos la publicación de tipo ScreenShare
    screenSharePublication.value = p.getTrackPublication(Track.Source.ScreenShare) ?? null;

    console.log('[useParticipantTracks] -> ✅ Done updating.', { 
      cam: cameraPublication.value, 
      mic: microphonePublication.value,
      screen: screenSharePublication.value, // ❗️ NUEVO: Lo añadimos al log
    });
  };

  const onPublicationsChanged = (pub: TrackPublication) => {
    console.log('[useParticipantTracks] -> 👂 Participant event detected!', pub);
    updatePublications();
  };

  watch(participant, (newP, oldP) => {
    console.log(`[useParticipantTracks] 👂 Participant watcher fired. New: ${newP?.identity}, Old: ${oldP?.identity}`);
    if (oldP) {
      oldP.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
    }
    if (newP) {
      newP.on(ParticipantEvent.TrackPublished, onPublicationsChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
      updatePublications();
    }
  }, { immediate: true });

  onUnmounted(() => {
    console.log('[useParticipantTracks] 🧹 Unmounting. Cleaning up listeners.');
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackPublished, onPublicationsChanged);
      participant.value.off(ParticipantEvent.TrackUnpublished, onPublicationsChanged);
    }
  });

  return {
    cameraPublication,
    microphonePublication,
    screenSharePublication, 
    updatePublications, 
  };
}