<template>
  <div class="playlist-container" @click.stop>
    <button
      @click="closePlaylist"
      class="close-button"
      aria-label="Cerrar lista"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <ul class="track-list">
      <li
        v-for="(track, index) in playlist"
        :key="`${track.id}-${index}`"
        @click="playTrack(index)"
        :class="{ 'current-track': index === currentTrackIndex }"
        class="track-item"
        ref="trackElements"
      >
        <div class="track-details">
          <span class="track-title">
            {{ track.title }}
            <span v-if="track.artistName" class="track-artist"
              >({{ track.artistName }})</span
            >
          </span>
        </div>
        <span v-if="track.duration_seconds" class="track-duration">
          {{ formatDuration(track.duration_seconds) }}
        </span>
      </li>
      <li v-if="playlist.length === 0" class="empty-list">
        No hay canciones en la lista.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { usePlayerStore } from '../../stores/playerStore'
import { storeToRefs } from 'pinia'

const playerStore = usePlayerStore()
const { playlist, currentTrackIndex } = storeToRefs(playerStore)
const trackElements = ref<HTMLLIElement[]>([])

const closePlaylist = () => {
  playerStore.togglePlaylistVisibility()
}

const playTrack = (index: number) => {
  playerStore.playTrackFromPlaylist(index)
}

const formatDuration = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

watch(
  currentTrackIndex,
  (newIndex) => {
    if (newIndex === null || newIndex < 0) return
    nextTick(() => {
      const el = trackElements.value[newIndex]
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    })
  },
  { immediate: true },
)
</script>

<style scoped>
.playlist-container {
  pointer-events: auto;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(75px);
  z-index: 10;

  width: 100%;
  max-width: 260px;
  max-height: 200px;

  background-color: rgba(25, 25, 25, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid #444;
}

.close-button {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  border: none;
  color: #aaa;
  padding: 0.25rem;
  transition:
    color 0.2s,
    transform 0.2s;
  z-index: 5;
}

.close-button:hover {
  color: white;
  transform: scale(1.1);
}

.track-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.track-item {
  display: flex;
  justify-content: space-between;
  padding: 0.1rem 0.55rem;
  border-radius: 5px;
  transition:
    background-color 0.2s,
    color 0.2s;
  border-bottom: 1px solid #282828;
}
.track-item:hover {
  background-color: #2a2a2a;
}
.track-item:last-child {
  border-bottom: none;
}

.track-title {
  font-size: 0.8rem;
  font-weight: 500;
}

.track-artist {
  font-size: 0.7rem;
  color: #999;
  margin-left: 0.3rem;
}

.track-duration {
  font-size: 0.8rem;
  color: #aaa;
  font-variant-numeric: tabular-nums;
}

.current-track,
.current-track:hover {
  background-color: var(--current-mood-color, #3b82f6);
  color: var(--current-mood-text-color, white);
}

.current-track .track-artist,
.current-track .track-duration {
  color: var(--current-mood-secondary-text-color, #e0e0e0);
}

.empty-list {
  text-align: center;
  padding: 3rem 1rem;
  color: #777;
  font-size: 0.9rem;
}
</style>
