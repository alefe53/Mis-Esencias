// RUTA: src/composables/streaming/useRemoteParticipantTracks.ts

import { shallowRef, watch, onUnmounted, type Ref } from 'vue';
import { ParticipantEvent, Track, type RemoteParticipant, type TrackPublication } from 'livekit-client';

export function useRemoteParticipantTracks(participant: Ref<RemoteParticipant | null>) {
  const cameraPublication = shallowRef<TrackPublication | null>(null);
  const screenSharePublication = shallowRef<TrackPublication | null>(null);

  // ▼▼▼ NUEVAS BANDERAS REACTIVAS ▼▼▼
  // Estas son las que Vue sí detectará cuando cambien.
  const cameraReady = shallowRef<boolean>(false);
  const screenReady  = shallowRef<boolean>(false);

  const updatePublications = (p: RemoteParticipant | null) => {
    if (!p) {
      cameraPublication.value = null;
      screenSharePublication.value = null;
      cameraReady.value = false;
      screenReady.value = false;
      return;
    }

    const camPub = p.getTrackPublication(Track.Source.Camera) ?? null;
    const scrPub = p.getTrackPublication(Track.Source.ScreenShare) ?? null;

    cameraPublication.value = camPub;
    screenSharePublication.value = scrPub;

    // Actualizamos nuestras banderas reactivas basándonos en si el track real está disponible.
    cameraReady.value = !!(camPub?.track);
    screenReady.value = !!(scrPub?.track);

    console.debug('[ViewerTracks] -> 🔄 Publicaciones actualizadas:', {
      participant: p.identity,
      cameraReady: cameraReady.value,
      screenReady: screenReady.value
    });
  };

  const onTrackStateChanged = () => {
    console.log('[ViewerTracks] -> 👂 Evento de track detectado. Re-evaluando publicaciones...');
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
    // Limpieza
    const p = participant.value;
    if (p) {
      p.off(ParticipantEvent.TrackPublished, onTrackStateChanged);
      p.off(ParticipantEvent.TrackUnpublished, onTrackStateChanged);
      p.off(ParticipantEvent.TrackMuted, onTrackStateChanged);
      p.off(ParticipantEvent.TrackUnmuted, onTrackStateChanged);
      p.off(ParticipantEvent.TrackSubscribed, onTrackStateChanged);
      p.off(ParticipantEvent.TrackUnsubscribed, onTrackStateChanged);
    }
  });

  return {
    cameraPublication,
    screenSharePublication,
    // Exportamos las nuevas banderas
    cameraReady,
    screenReady,
  };
}