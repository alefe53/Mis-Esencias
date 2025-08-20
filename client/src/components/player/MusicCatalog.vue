<template>
  <div class="catalog-container" @click.stop>
    <div v-if="isLoading" class="loader">Cargando catálogo...</div>
    <ul v-else-if="catalog.length > 0" class="track-list">
      <li
        v-for="track in catalog"
        :key="track.id"
        class="track-item"
        :style="trackItemHoverStyle(track)"
      >
        <div class="track-info">
          <span class="track-title" :title="track.title">{{
            track.title
          }}</span>
          <span class="track-artist">{{ track.artistName }}</span>
        </div>
        <button
          @click="handleAddToQueue(track)"
          class="add-queue-btn"
          :class="{ 'is-added': recentlyAdded.has(track.id) }"
          title="Agregar a la cola"
          :disabled="recentlyAdded.has(track.id)"
        >
          <span v-if="recentlyAdded.has(track.id)">✓</span>
          <span v-else>+</span>
        </button>
      </li>
    </ul>
    <div v-else class="loader">No hay música en el catálogo.</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMusicCatalogStore } from '../../stores/musicCatalogStore'
import { usePlayerStore } from '../../stores/playerStore'
import { useUiStore } from '../../stores/uiStore'
import type { Track } from '../../types'
import { moodColors } from '../../constants/moods'

defineEmits(['close'])

const catalogStore = useMusicCatalogStore()
const playerStore = usePlayerStore()
const uiStore = useUiStore()

const { catalog, isLoading } = storeToRefs(catalogStore)
const recentlyAdded = ref(new Set<number>())

const trackItemHoverStyle = (track: Track) => {
  if (!track.moods || track.moods.length === 0) {
    return {
      '--track-hover-bg': 'rgba(255, 255, 255, 0.1)',
      '--track-hover-text': '#FFFFFF',
      '--track-hover-artist-color': '#a0a0a0',
    }
  }
  const primaryMoodName = track.moods[0].name
  const color = moodColors[primaryMoodName] || 'rgba(255, 255, 255, 0.1)'

  const lightColors = ['Lo que sea', 'Llevándola']
  const textColor = lightColors.includes(primaryMoodName)
    ? '#111827'
    : '#FFFFFF'
  const artistColor = lightColors.includes(primaryMoodName)
    ? '#4B5563'
    : '#a0a0a0'

  return {
    '--track-hover-bg': color,
    '--track-hover-text': textColor,
    '--track-hover-artist-color': artistColor,
  }
}

const handleAddToQueue = (track: Track) => {
  if (recentlyAdded.value.has(track.id)) return

  playerStore.addToQueue(track)
  uiStore.showToast({ message: `'${track.title}' se agregó a la cola` })

  recentlyAdded.value.add(track.id)
  setTimeout(() => {
    recentlyAdded.value.delete(track.id)
  }, 1500)
}
</script>

<style scoped>
.catalog-container {
  pointer-events: auto;
  position: absolute;
  bottom: 0;
  right: calc(100% + 12px);
  z-index: 10;
  width: 250px;
  max-height: 300px;
  background-color: rgba(25, 25, 25, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid #444;
  overflow: hidden;
}

.track-list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 #333;
}

.track-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border-radius: 5px;
  margin-bottom: 4px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.track-item:hover {
  background-color: var(--track-hover-bg);
}

.track-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 0.5rem;
}

.track-title {
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: #ccc;
  transition: color 0.2s ease;
}

.track-item:hover .track-title {
  color: var(--track-hover-text);
}

.track-artist {
  font-size: 0.7rem;
  color: #888;
  transition: color 0.2s ease;
}

.track-item:hover .track-artist {
  color: var(--track-hover-artist-color);
}

.add-queue-btn {
  background-color: transparent;
  border: none;
  padding: 0.25rem 0.5rem;
  margin: -0.25rem -0.5rem;
  flex-shrink: 0;

  font-size: 1.6rem;
  font-weight: 300;
  line-height: 1;
  color: #888;

  transition:
    color 0.2s ease,
    transform 0.2s ease;
  text-shadow: 0px 1px 4px rgba(0, 0, 0, 0.5);
}

.add-queue-btn:hover:not(.is-added) {
  color: #22c55e;
  transform: scale(1.3);
}

.add-queue-btn.is-added {
  color: #22c55e;
  cursor: default;
  font-weight: bold;
}

.loader {
  color: #999;
  margin: auto;
  padding: 2rem;
  font-size: 0.9rem;
}
</style>
