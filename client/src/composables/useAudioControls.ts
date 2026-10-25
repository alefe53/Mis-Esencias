//src/composables/useAudioControls.ts
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/playerStore'

export function useAudioControls() {
  const playerStore = usePlayerStore()
  const { currentTrack, isPlaying } = storeToRefs(playerStore)
  const { playNext } = playerStore

  const audioRef = ref<HTMLAudioElement | null>(null)

  watch(currentTrack, async (newTrack) => {
    if (newTrack && newTrack.playableUrl && audioRef.value) {
      audioRef.value.src = newTrack.playableUrl
      try {
        await audioRef.value.play()
        playerStore.isPlaying = true
      } catch (error) {
        console.error(
          'Error al reproducir el audio (posible bloqueo de autoplay):',
          error,
        )
        playerStore.isPlaying = false
      }
    }
  })

  watch(isPlaying, async (playing) => {
    if (!audioRef.value) return
    try {
      if (playing) {
        await audioRef.value.play()
      } else {
        audioRef.value.pause()
      }
    } catch (error) {
      console.error('Error en toggle play/pause:', error)
      playerStore.isPlaying = false
    }
  })

  const onTrackEnded = () => {
    playNext()
  }

  return {
    audioRef,
    onTrackEnded,
  }
}
