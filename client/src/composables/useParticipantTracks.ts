// RUTA: src/composables/useParticipantTracks.ts

import { ref, watch, onUnmounted, type Ref } from 'vue';
import {
  type Participant,
  type TrackPublication,
  Track,
  TrackEvent,
  ParticipantEvent, // ✨ IMPORTANTE: Importamos ParticipantEvent
} from 'livekit-client';

export function useParticipantTracks(participant: Ref<Participant | null>) {
  // Las publicaciones de tracks
  const cameraTrackPub = ref<TrackPublication | null>(null);
  const screenShareTrackPub = ref<TrackPublication | null>(null);
  const audioTrackPub = ref<TrackPublication | null>(null);

  // El estado reactivo que usará la UI
  const isCameraEnabled = ref(false);
  const isScreenShareEnabled = ref(false);
  const isAudioEnabled = ref(false);

  // --- Lógica de actualización ---

  const updateState = () => {
    if (!participant.value) return;

    // Obtenemos las publicaciones de tracks actuales
    cameraTrackPub.value = participant.value.getTrackPublication(Track.Source.Camera) ?? null;
    screenShareTrackPub.value = participant.value.getTrackPublication(Track.Source.ScreenShare) ?? null;
    audioTrackPub.value = participant.value.getTrackPublication(Track.Source.Microphone) ?? null;
    
    // Leemos el estado INICIAL de cada track
    // Un track está "habilitado" si su publicación existe y NO está muteada
    isCameraEnabled.value = !!cameraTrackPub.value && !cameraTrackPub.value.isMuted;
    isScreenShareEnabled.value = !!screenShareTrackPub.value && !screenShareTrackPub.value.isMuted;
    isAudioEnabled.value = !!audioTrackPub.value && !audioTrackPub.value.isMuted;
  };

  // --- Lógica para escuchar eventos ---

  // Se activa cuando un track se mutea o desmutea
  const onTrackMutedChanged = () => {
    // Simplemente volvemos a leer todo el estado
    updateState();
  };
  
  // Se activa cuando un nuevo track se publica o despublica
  const onTrackPublishedChanged = () => {
    // Volvemos a leer todo el estado
    updateState();
  };
  
  // --- Hook de ciclo de vida ---

  watch(participant, (newP, oldP) => {
    if (oldP) {
      // Limpiamos los listeners del participante anterior para evitar fugas de memoria
      oldP.off(ParticipantEvent.TrackMuted, onTrackMutedChanged);
      oldP.off(ParticipantEvent.TrackUnmuted, onTrackMutedChanged);
      oldP.off(ParticipantEvent.TrackPublished, onTrackPublishedChanged);
      oldP.off(ParticipantEvent.TrackUnpublished, onTrackPublishedChanged);
    }
    if (newP) {
      // Leemos el estado inicial en cuanto tenemos al nuevo participante
      updateState();

      // Y nos suscribimos a TODOS los eventos relevantes para el futuro
      newP.on(ParticipantEvent.TrackMuted, onTrackMutedChanged);
      newP.on(ParticipantEvent.TrackUnmuted, onTrackMutedChanged);
      newP.on(ParticipantEvent.TrackPublished, onTrackPublishedChanged);
      newP.on(ParticipantEvent.TrackUnpublished, onTrackPublishedChanged);
    }
  }, { immediate: true });

  onUnmounted(() => {
    // Nos aseguramos de limpiar todo cuando el componente se destruye
    if (participant.value) {
      participant.value.off(ParticipantEvent.TrackMuted, onTrackMutedChanged);
      participant.value.off(ParticipantEvent.TrackUnmuted, onTrackMutedChanged);
      participant.value.off(ParticipantEvent.TrackPublished, onTrackPublishedChanged);
      participant.value.off(ParticipantEvent.TrackUnpublished, onTrackPublishedChanged);
    }
  });

  return {
    cameraTrackPub,
    screenShareTrackPub,
    audioTrackPub,
    isCameraEnabled,
    isScreenShareEnabled,
    isAudioEnabled,
  };
}