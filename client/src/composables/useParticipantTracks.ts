//composables/useParticipantTracks.ts
import { onMounted, onUnmounted, shallowRef, watch, type Ref } from 'vue'
import {
  type Participant,
  type TrackPublication,
  type RemoteTrack,
  type RemoteTrackPublication,
  Track,
  RoomEvent,
} from 'livekit-client'
export function useParticipantTracks(participant: Ref<Participant | null>) {
  const cameraTrackPub = shallowRef<TrackPublication | null>(null)
  const screenShareTrackPub = shallowRef<TrackPublication | null>(null)
  const audioTrackPub = shallowRef<TrackPublication | null>(null)
  const updateTracks = () => {
    if (!participant.value) {
      cameraTrackPub.value = null
      screenShareTrackPub.value = null
      audioTrackPub.value = null
      return
    }
    cameraTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Camera) ?? null
    screenShareTrackPub.value =
      participant.value.getTrackPublication(Track.Source.ScreenShare) ?? null
    audioTrackPub.value =
      participant.value.getTrackPublication(Track.Source.Microphone) ?? null
  }
  const onTrackSubscribed = (
    track: RemoteTrack,
    pub: RemoteTrackPublication,
  ) => {
    updateTracks()
  }
  const onTrackUnsubscribed = (
    track: RemoteTrack,
    pub: RemoteTrackPublication,
  ) => {
    updateTracks()
  }
  const setupListeners = (p: Participant) => {
    p.on(RoomEvent.TrackSubscribed, onTrackSubscribed)
    p.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
    p.on(RoomEvent.LocalTrackPublished, updateTracks)
    p.on(RoomEvent.LocalTrackUnpublished, updateTracks)
  }
  const cleanupListeners = (p: Participant) => {
    p.off(RoomEvent.TrackSubscribed, onTrackSubscribed)
    p.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
    p.off(RoomEvent.LocalTrackPublished, updateTracks)
    p.off(RoomEvent.LocalTrackUnpublished, updateTracks)
  }
  onMounted(updateTracks)
  onUnmounted(() => {
    if (participant.value) {
      cleanupListeners(participant.value)
    }
  })
  watch(
    participant,
    (newP, oldP) => {
      if (oldP) {
        cleanupListeners(oldP)
      }
      if (newP) {
        setupListeners(newP)
      }
      updateTracks()
    },
    { immediate: true },
  )
  return {
    cameraTrackPub,
    screenShareTrackPub,
    audioTrackPub,
  }
}