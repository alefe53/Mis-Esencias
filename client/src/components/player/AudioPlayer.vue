<template>
  <div
    class="player-and-playlist-wrapper"
    ref="playerWrapperRef"
    :style="wrapperStyle"
    :class="{
      'is-on-auth-page': isAuthView,
      'is-docked': playerState === 'docked',
      'is-hidden': playerState === 'hidden',
    }"
  >
    <button
      v-if="playerState === 'maximized' || playerState === 'docked'"
      @click="minimizePlayer"
      class="player-control-btn minimize-btn"
    >
      <Minus :size="20" :stroke-width="2.5" />
    </button>
    <button
      v-if="playerState === 'docked' || playerState === 'hidden'"
      @click="maximizePlayer"
      class="player-control-btn maximize-btn"
    >
      <Plus :size="20" :stroke-width="2.5" />
    </button>
    <div class="player-content-wrapper">
      <transition name="playlist-fade">
        <MusicCatalog
          v-if="isCatalogVisible"
          @close="isCatalogVisible = false"
        />
      </transition>
      <transition name="playlist-fade">
        <Playlist v-if="isPlaylistVisible" />
      </transition>
      <div class="player-wrapper">
        <div class="audio-player-container">
          <div class="side-panel-container" v-if="!isAuthView">
            <button
              @click="toggleMoodList"
              class="side-button"
              :style="moodButtonStyle"
            >
              {{ currentMoodName }}
            </button>
            <transition name="fade-up">
              <ul
                v-if="isMoodListVisible"
                class="mood-list"
                :class="{ 'shifted-left': showInitialPrompt }"
              >
                <li
                  v-for="mood in availableMoods"
                  :key="mood.id"
                  @click="selectMood(mood.id)"
                  class="mood-item"
                  :style="{ '--hover-color': getHoverColorForMood(mood.name) }"
                >
                  {{ mood.name }}
                </li>
              </ul>
            </transition>
          </div>
          <div class="center-column">
            <div class="player-controls-pill">
              <transition name="fade">
                <div v-if="showInitialPrompt" class="initial-prompt-tooltip">
                  Apretá para escuchar algo de mi música.
                </div>
              </transition>
              <transition name="fade-info">
                <div
                  v-if="showTrackInfo && currentTrack"
                  class="track-info-toast"
                >
                  <p class="track-title">{{ currentTrack.title }}</p>
                  <p
                    v-if="
                      currentTrack.artistName || currentTrack.releaseInfo?.year
                    "
                    class="artist-name"
                  >
                    {{ currentTrack.artistName }} ({{
                      currentTrack.releaseInfo?.year
                    }})
                  </p>
                </div>
              </transition>
              <div class="controls">
                <button
                  @click="playPrevious"
                  :disabled="
                    !currentTrack || playerStore.currentTrackIndex === 0
                  "
                  class="control-button"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                  </svg>
                </button>
                <button
                  @click="handlePrimaryPlay"
                  class="control-button play-pause"
                >
                  <svg
                    v-if="!isPlaying"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <svg
                    v-else
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
                <button
                  @click="playNext"
                  :disabled="!currentTrack || !hasNext"
                  class="control-button"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="secondary-controls">
              <button
                v-if="!isAuthView"
                @click="toggleCatalogVisibility"
                class="side-button catalog-toggle-btn"
                :class="{ pressed: isCatalogVisible }"
                aria-label="Mostrar catálogo de música"
              >
                C
              </button>
              <button
                v-if="!isAuthView"
                @click="togglePlaylistVisibility"
                :disabled="playlist.length === 0"
                class="side-button playlist-toggle-btn"
                :class="{ pressed: isPlaylistVisible }"
                aria-label="Mostrar lista de reproducción"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            </div>
          <div
            class="side-panel-container"
            v-if="!isAuthView"
            :class="{ placeholder: showInitialPrompt }"
          >
            <button
              @click="toggleTrackDescription"
              :class="{ pressed: isTrackDescriptionVisible }"
              :disabled="!currentTrack?.description"
              class="side-button"
            >
              Descripción
            </button>
            <transition name="fade-side">
              <div
                v-if="isTrackDescriptionVisible && currentTrack?.description"
                class="description-panel track-desc"
              >
                <p>{{ currentTrack.description }}</p>
              </div>
            </transition>
          </div>
        </div>
        <transition name="fade-up">
          <div
            v-if="currentTrack && currentTrack.releaseInfo && !isAuthView"
            class="release-info-bar"
          >
            <img
              v-if="currentTrack.releaseInfo.coverArtUrl"
              :src="currentTrack.releaseInfo.coverArtUrl"
              alt="Cover del álbum"
              class="release-cover-art"
            />
            <div class="release-text-content">
              <span
                @click="toggleReleaseDescription"
                class="release-title"
                :class="{ disabled: !currentTrack.releaseInfo.description }"
              >
                {{ currentTrack.releaseInfo.title }}
              </span>
              <span class="release-year">{{
                currentTrack.releaseInfo.year
              }}</span>
            </div>
            <transition name="fade-side-left">
              <div
                v-if="
                  isReleaseDescriptionVisible &&
                  currentTrack.releaseInfo.description
                "
                class="description-panel release-desc"
              >
                <p>{{ currentTrack.releaseInfo.description }}</p>
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </div>
    <audio ref="audioRef" @ended="onTrackEnded" style="display: none"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayerStore } from '../../stores/playerStore'
import { storeToRefs } from 'pinia'
import { useAudioControls } from '../../composables/useAudioControls'
import { useClickOutside } from '../../composables/useClickOutside'
import { moodColors } from '../../constants/moods'
import Playlist from './Playlist.vue'
import MusicCatalog from './MusicCatalog.vue'
import { useUiStore } from '../../stores/uiStore'
import { useMusicCatalogStore } from '../../stores/musicCatalogStore'
import { Minus, Plus } from 'lucide-vue-next'

const playerStore = usePlayerStore()
const uiStore = useUiStore()
const catalogStore = useMusicCatalogStore()
const {
  currentTrack,
  isPlaying,
  hasNext,
  currentMoodId,
  isPlaylistVisible,
  playlist,
  playerState,
} = storeToRefs(playerStore)
const { availableMoods, isMoodsLoading } = storeToRefs(uiStore)
const {
  togglePlayPause,
  playNext,
  playPrevious,
  fetchAndPlayPlaylist,
  minimizePlayer,
  maximizePlayer,
} = playerStore
const route = useRoute()
const { audioRef, onTrackEnded } = useAudioControls()
const playerWrapperRef = ref<HTMLElement>()
const showTrackInfo = ref(false)
let infoTimeout: number | undefined
const isMoodListVisible = ref(false)
const isTrackDescriptionVisible = ref(false)
const isReleaseDescriptionVisible = ref(false)
const isCatalogVisible = ref(false)
useClickOutside(playerWrapperRef, () => {
  if (isCatalogVisible.value) isCatalogVisible.value = false
  if (isPlaylistVisible.value) playerStore.togglePlaylistVisibility()
})
const isAuthView = computed(() => {
  const authPaths = ['/auth', '/profile', '/info', '/admin','/subscribe']
  return authPaths.some((basePath) => route.path.startsWith(basePath))
})
const togglePlaylistVisibility = () => {
  playerStore.togglePlaylistVisibility()
  if (playerStore.isPlaylistVisible && isCatalogVisible.value) {
    isCatalogVisible.value = false
  }
}
const toggleCatalogVisibility = () => {
  isCatalogVisible.value = !isCatalogVisible.value
  if (isCatalogVisible.value) {
    catalogStore.fetchCatalog()
    if (isPlaylistVisible.value) playerStore.togglePlaylistVisibility()
  }
}
const currentMoodName = computed(() => {
  if (isMoodsLoading.value) return 'Cargando...'
  if (currentMoodId.value === null) return 'Estado de Ánimo'
  const mood = availableMoods.value.find((m) => m.id === currentMoodId.value)
  return mood ? mood.name : 'Estado de Ánimo'
})
const moodButtonStyle = computed(() => {
  if (currentMoodId.value === null) return {}
  const moodName = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )?.name
  if (moodName) {
    const color = moodColors[moodName]
    return {
      backgroundColor: color,
      color:
        moodName === 'Lo que sea' || moodName === 'Llevándola'
          ? '#111827'
          : '#FFFFFF',
      borderColor: color,
    }
  }
  return {}
})
const wrapperStyle = computed(() => {
  if (currentMoodId.value === null) return {}
  const moodName = availableMoods.value.find(
    (m) => m.id === currentMoodId.value,
  )?.name
  if (moodName && moodColors[moodName]) {
    const isLightColor = moodName === 'Lo que sea' || moodName === 'Llevándola'
    return {
      '--current-mood-color': moodColors[moodName],
      '--current-mood-text-color': isLightColor ? '#111827' : '#FFFFFF',
      '--current-mood-secondary-text-color': isLightColor
        ? '#374151'
        : '#e0e0e0',
    }
  }
  return {}
})
const getHoverColorForMood = (moodName: string) => {
  return moodColors[moodName] || '#FFFFFF'
}
const toggleMoodList = () => {
  uiStore.ensureMoodsAvailable()
  isMoodListVisible.value = !isMoodListVisible.value
}
const showInitialPrompt = computed(() => {
  return !uiStore.hasShownInitialPrompt && !currentTrack.value
})
const selectMood = (moodId: number) => {
  if (!uiStore.hasShownInitialPrompt) {
    uiStore.setInitialPromptAsShown()
  }
  uiStore.activateMoodGlow()
  fetchAndPlayPlaylist(moodId)
  isMoodListVisible.value = false
}
const toggleTrackDescription = () => {
  isTrackDescriptionVisible.value = !isTrackDescriptionVisible.value
  isReleaseDescriptionVisible.value = false
}
const toggleReleaseDescription = () => {
  isReleaseDescriptionVisible.value = !isReleaseDescriptionVisible.value
  isTrackDescriptionVisible.value = false
}
const triggerTrackInfoToast = () => {
  if (!currentTrack.value) return
  showTrackInfo.value = true
  clearTimeout(infoTimeout)
  infoTimeout = window.setTimeout(() => {
    showTrackInfo.value = false
  }, 4000)
}
watch(currentTrack, (newTrack) => {
  if (newTrack) {
    triggerTrackInfoToast()
  }
  if (!newTrack?.description) {
    isTrackDescriptionVisible.value = false
  }
  if (!newTrack?.releaseInfo?.description) {
    isReleaseDescriptionVisible.value = false
  }
})
const handlePrimaryPlay = async () => {
  if (availableMoods.value.length === 0) {
    await uiStore.ensureMoodsAvailable()
  }
  const moodToPlay = currentMoodId.value === null ? 5 : currentMoodId.value
  if (!currentTrack.value) {
    uiStore.setInitialPromptAsShown()
    fetchAndPlayPlaylist(moodToPlay)
  } else {
    togglePlayPause()
    triggerTrackInfoToast()
  }
}
</script>

<style scoped>
@keyframes pulse-animation {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 10px 10px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.player-and-playlist-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none;
  transition:
    justify-content 0.5s ease,
    left 0.5s ease,
    bottom 0.5s ease;
}
.player-content-wrapper {
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
  pointer-events: auto;
}
.player-and-playlist-wrapper.is-docked {
  justify-content: flex-start;
  left: 1rem;
  bottom: 1rem;
  width: auto;
}
.player-and-playlist-wrapper.is-hidden .player-content-wrapper {
  transform: translateY(250px);
  opacity: 0;
}
.player-and-playlist-wrapper.is-on-auth-page {
  justify-content: flex-start;
  bottom: 2rem;
  left: 13rem;
  width: auto;
}
.player-and-playlist-wrapper.is-on-auth-page.is-docked {
  left: 1rem;
}
.player-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 2rem;
}
.is-on-auth-page .player-wrapper,
.is-docked .player-wrapper {
  padding-bottom: 0;
}
.audio-player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.player-control-btn {
  all: unset;
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #2a2a2a;
  color: #ccc;
  border: 1px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1001;
  pointer-events: auto;
}
.player-control-btn:hover {
  background-color: #3a3a3a;
  transform: scale(1.1);
}
.minimize-btn {
  bottom: 1rem;
  left: calc(50% - 160px);
}
.maximize-btn {
  bottom: 1rem;
  left: calc(50% - 145px);
}
.is-docked .minimize-btn {
  bottom: 5px;
  left: -15px;
}
.is-docked .maximize-btn {
  bottom: 5px;
  left: 25px;
}
.is-hidden .maximize-btn {
  bottom: 1rem;
  left: calc(50% - 16px); 
  animation: pulse-animation 2.5s infinite ease-in-out;
}
.center-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}
.player-controls-pill {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 100px;
  background-color: #000;
  border-radius: 50%;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
}
.playlist-toggle-btn {
  position: absolute;
  top: 50%;
  left: calc(50% + 60px);
  transform: translate(-50%, 20px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  width: 35px;
  height: 35px;
  border-radius: 50%;
}
.initial-prompt-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  white-space: nowrap;
  font-size: 0.9rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
.track-info-toast {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(25, 25, 25, 0.9);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  backdrop-filter: blur(4px);
}
.track-title {
  font-weight: bold;
  margin: 0;
  font-size: 0.9rem;
}
.artist-name {
  font-size: 0.8rem;
  margin: 4px 0 0;
  opacity: 0.8;
}
.controls {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-around;
  padding: 0 10px;
}
.control-button {
  background: none;
  border: none;
  color: white;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}
.control-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.play-pause {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
  transition: transform 0.2s ease;
}
.play-pause:hover:not(:disabled) {
  transform: scale(1.1);
}
.side-panel-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}
.side-panel-container.placeholder {
  visibility: hidden;
}
.side-button {
  background-color: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.8rem;
  transition: all 0.2s;
  white-space: nowrap;
}
.side-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #1f1f1f;
}
.side-button:hover:not(:disabled) {
  background-color: #3a3a3a;
  color: white;
}
.mood-item:hover {
  background-color: var(--hover-color, #3b82f6);
  color: #111827;
  font-weight: 500;
}
.side-button.pressed {
  background-color: #4b5563;
  color: white;
  border-color: #6b7280;
}
.mood-list {
  position: absolute;
  bottom: calc(100% + 8px);
  list-style: none;
  margin: 0;
  padding: 8px;
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid #555;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  min-width: 150px;
  transition: right 0.3s ease;
  right: 0;
}
.mood-item {
  color: #eee;
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 0.75rem;
  transition:
    background-color 0.2s,
    color 0.2s;
}
.release-info-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(25, 25, 25, 0.8);
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid #333;
  backdrop-filter: blur(5px);
  position: relative;
}
.release-cover-art {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}
.release-text-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.release-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #eee;
}
.release-year {
  font-size: 0.75rem;
  color: #aaa;
}
.description-panel {
  position: absolute;
  bottom: 0;
  width: 250px;
  max-height: 100px;
  overflow-y: auto;
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid #555;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  padding: 12px;
  font-size: 0.85rem;
  color: #ddd;
}
.track-desc {
  left: calc(100% + 12px);
}
.release-desc {
  right: calc(100% + 12px);
}
.playlist-fade-enter-active,
.playlist-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.playlist-fade-enter-from,
.playlist-fade-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}
.fade-up-enter-active,
.fade-up-leave-active,
.fade-side-enter-active,
.fade-side-leave-active,
.fade-enter-active,
.fade-leave-active,
.fade-info-enter-active,
.fade-info-leave-active,
.fade-side-left-enter-active,
.fade-side-left-leave-active {
  transition: all 0.3s ease;
}
.fade-up-enter-from,
.fade-up-leave-to,
.fade-enter-from,
.fade-leave-to,
.fade-info-enter-from,
.fade-info-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-side-enter-from,
.fade-side-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-side-left-enter-from,
.fade-side-left-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.catalog-toggle-btn {
  position: absolute;
  top: 50%;
  right: calc(50% + 30px);
  transform: translate(-50%, 20px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  font-weight: bold;
  font-family: 'Uncial Antiqua', cursive;
  font-size: 1.1rem;
}
.catalog-container {
  bottom: calc(40% + 0px);
  left: 25%;
  transform: translateX(-50%);
}
@media (max-width: 768px) {
  .audio-player-container {
 display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
  }
  .center-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .secondary-controls {
    display: flex;
    gap: 15px;
  }
  .side-panel-container {
    flex: 1;
  }
  .side-panel-container:first-of-type {
    display: flex;
    justify-content: flex-start;
  }
  .side-panel-container:last-of-type {
    display: flex;
    justify-content: flex-end;
  }

  .mood-list {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 280px; 
    max-height: 700vh;
    background-color: #1e1e1e; 
    border: 1px solid #555;
    border-radius: 12px;
    z-index: 1100;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    padding: 0.75rem;
    
    overflow-y: auto;
    list-style: none;
  }

  .mood-item {
    font-size: 0.9rem; 
    color: #eee;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 6px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    white-space: normal;
  }
  .mood-item:last-child {
    margin-bottom: 0;
  }
  .mood-item:hover {
    color: white;
    background-color: var(--hover-color, #3b82f6);
  }

  .description-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 320px;
    max-height: 70vh;
    background-color: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid #555;
    border-radius: 12px;
    z-index: 1100;
    padding: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
}
</style>
