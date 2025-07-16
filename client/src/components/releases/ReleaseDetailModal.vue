<template>
  <transition name="modal-fade">
    <div class="modal-backdrop" @click="$emit('close')">
      <div class="modal-content" :style="modalStyle" @click.stop>
        <button
          class="close-button"
          @click="$emit('close')"
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <div v-if="isLoading" class="loader">Cargando detalles...</div>

        <div v-else-if="release" class="details-container">
          <div class="header">
            <img
              v-if="release.coverArtUrl"
              :src="release.coverArtUrl"
              :alt="release.title"
              class="header-cover"
            />
            <div class="header-info">
              <h1>{{ release.title }}</h1>
              <h2>
                por {{ release.artistName }} ({{ release.releaseYear }})
              </h2>
              <p v-if="release.description" class="header-description">
                {{ release.description }}
              </p>
              <button
                v-if="hasGallery"
                @click="isGalleryVisible = !isGalleryVisible"
                class="gallery-toggle-button"
              >
                {{ isGalleryVisible ? "Ocultar" : "Ver" }} Galería
              </button>
            </div>
          </div>
          
          <div class="scrollable-content">
            <div v-if="featuredVideoEmbedUrl" class="featured-video-container">
              <div class="video-wrapper">
                <iframe 
                  :src="featuredVideoEmbedUrl" 
                  title="Video destacado del lanzamiento" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen>
                </iframe>
              </div>
            </div>

            <div v-if="!isGalleryVisible" class="main-content">
              <div class="tracks-section">
                <div class="tracks-header">
                  <h3>Tracks</h3>
                  <button
                    @click="handlePlayAll"
                    class="play-all-button"
                    aria-label="Reproducir todo"
                  >
                    <PlayCircle :size="32" stroke-width="1.5" />
                  </button>
                </div>
                <ul class="tracks-list">
                  <li
                    v-for="track in release.tracks"
                    :key="track.id"
                    :class="{ locked: isTrackLocked(track) }"
                    @click="handleTrackClick(track)"
                    :style="getHoverStyleForTrack(track)"
                  >
                    <TrackTooltip
                      v-if="activeTooltipTrackId === track.id"
                      :message="tooltipMessage"
                      :color="tooltipColor"
                    />

                    <span class="track-number">{{ track.trackNumber }}.</span>
                    <span class="track-title">{{ track.title }}</span>

                    <div class="platform-icons">
                      <button
                        v-for="link in track.links?.filter(l => l.platform.toLowerCase() !== 'local')"
                        :key="link.platform"
                        class="platform-icon-button"
                        @click.stop="openEmbedModal(link)"
                      >
                        <PlatformIcon :platform="link.platform" />
                      </button>
                    </div>
                    
                    <span v-if="isTrackLocked(track)" class="lock-icon">🔒</span>
                  </li>
                </ul>
              </div>
            </div>

            <div v-else class="gallery-section">
              <div
                v-for="image in release.gallery"
                :key="image.id"
                class="gallery-item"
              >
                <img
                  :src="image.imageUrl"
                  :alt="image.description || 'Imagen de la galería'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <EmbedPlayerModal
    v-if="isEmbedModalVisible && selectedEmbed"
    :platform="selectedEmbed.platform"
    :url="selectedEmbed.url"
    @close="closeEmbedModal"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { usePlayerStore } from "../../stores/playerStore";
import { useAuthStore } from "../../stores/authStore";
import type { ReleaseDetails, Track, TrackLink } from "../../types";
import { moodColors } from "../../constants/moods";
import { PlayCircle } from "lucide-vue-next";
import PlatformIcon from "../common/PlatformIcon.vue";
import EmbedPlayerModal from "./EmbedPlayerModal.vue";
import TrackTooltip from "./TrackTooltip.vue"; // 1. Importa el nuevo componente

onMounted(() => {
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.body.style.overflow = 'auto';
});

const props = defineProps<{
  release: ReleaseDetails | null;
  isLoading: boolean;
}>();

const emit = defineEmits(["close"]);

const playerStore = usePlayerStore();
const authStore = useAuthStore();
// Ya no necesitamos uiStore para esto

const isGalleryVisible = ref(false);
const isEmbedModalVisible = ref(false);
const selectedEmbed = ref<TrackLink | null>(null);

// 2. Añade estado local para manejar el tooltip
const activeTooltipTrackId = ref<number | null>(null);
const tooltipMessage = ref('');
const tooltipColor = ref('');
let tooltipTimeout: number | undefined;

const userTier = computed(() => authStore.user?.subscription_tier_id || 1);

const hasGallery = computed(
  () => props.release?.gallery && props.release.gallery.length > 0,
);

const modalStyle = computed(() => {
  if (props.release?.coverArtUrl) {
    return { "--modal-bg-image": `url(${props.release.coverArtUrl})` };
  }
  return {};
});

const featuredVideoEmbedUrl = computed(() => {
  if (props.release?.featuredVideoUrl) {
    return `https://www.youtube.com/embed/${props.release.featuredVideoUrl}`;
  }
  return null;
});

function getHoverStyleForTrack(track: Track) {
  if (track.moods && track.moods.length > 0) {
    const moodName = track.moods[0].name;
    const color = moodColors[moodName];
    if (color) {
      const lightColors = ["Lo que sea", "Llevándola"];
      const textColor = lightColors.includes(moodName)
        ? "#111827"
        : "#FFFFFF";
      return {
        "--track-hover-bg": color,
        "--track-hover-text": textColor,
      };
    }
  }
  return {};
}

function isTrackLocked(track: Track): boolean {
  const requiredTier = track.required_subscription_tier_id || 1;
  return requiredTier > userTier.value;
}

// 3. Crea una función local para mostrar el tooltip
function showTrackTooltip(track: Track, message: string) {
  clearTimeout(tooltipTimeout);

  const moodName = track.moods?.[0]?.name || 'Lo que sea';
  tooltipColor.value = moodColors[moodName] || '#EF4444';
  tooltipMessage.value = message;
  activeTooltipTrackId.value = track.id;

  tooltipTimeout = window.setTimeout(() => {
    activeTooltipTrackId.value = null;
  }, 3000);
}

// 4. Modifica handleTrackClick para usar la nueva función
function handleTrackClick(track: Track) {
  if (isTrackLocked(track)) {
    // Para los tracks bloqueados, el tooltip es una buena opción también
    showTrackTooltip(track, "Requiere una suscripción de mayor nivel.");
    return;
  }
  
  const localLink = track.links?.find(link => link.platform.toLowerCase() === 'local');

  if (localLink) {
    playerStore.playTrackNow(track);
  } else {
    showTrackTooltip(track, "Contenido no disponible localmente. Usá alguno de los links de al lado.");
  }
}

// 5. Modifica handlePlayAll para usar un alert, ya que no puede apuntar a un solo track
function handlePlayAll() {
  if (!props.release?.tracks) return;

  const unlockedTracks = props.release.tracks.filter(
    (track) => !isTrackLocked(track)
  );

  if (unlockedTracks.length === 0) {
    alert("No hay canciones disponibles para reproducir con tu suscripción actual.");
    return;
  }

  const playableTracks = unlockedTracks.filter(track => 
    track.links?.some(link => link.platform.toLowerCase() === 'local')
  );

  if (playableTracks.length > 0) {
    playerStore.playAlbum(playableTracks);
  } else {
    // Un alert es más apropiado aquí porque la acción es general, no sobre un track
    alert("Ninguna canción de este álbum está disponible para reproducción local.");
  }
}

function openEmbedModal(link: TrackLink) {
  selectedEmbed.value = link;
  isEmbedModalVisible.value = true;
}

function closeEmbedModal() {
  isEmbedModalVisible.value = false;
  selectedEmbed.value = null;
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-content {
  color: #fff;
  padding: 2rem 3rem;
  border-radius: 12px;
  width: 90%;
  max-width: 950px;
  height: 85vh;
  border: 1px solid #444;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: transparent;
}
.modal-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--modal-bg-image);
  background-size: cover;
  background-position: center center;
  filter: blur(20px) brightness(0.4);
  z-index: -1;
  transition: background-image 0.5s ease-in-out;
}
.loader {
  margin: auto;
  font-size: 1.5rem;
}
.details-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #aaa;
  font-size: 2.5rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 10;
}
.close-button:hover {
  color: #fff;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.4s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(40px) scale(0.95);
  opacity: 0;
}
.header {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
}
.header-cover {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.header-info {
  display: flex;
  flex-direction: column;
}
.header-info h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
}
.header-info h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #ccc;
  font-weight: 400;
}
.header-info .header-description {
  font-size: 0.9rem;
  color: #aaa;
  flex-grow: 1;
  max-height: 70px;
  overflow-y: auto;
  margin-bottom: 1rem;
}
.scrollable-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 1rem;
  margin: 0 -1rem;
}
.featured-video-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}
.video-wrapper {
  width: 100%;
  max-width: 560px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
}
.video-wrapper iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
.main-content,
.gallery-section {
  background-color: rgba(0, 0, 0, 0.2);
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
}
.gallery-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  align-content: start;
}
.tracks-section {
  flex: 1;
  min-width: 300px;
}
.tracks-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.play-all-button {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: #ccc;
  transition: all 0.2s ease;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-all-button:hover {
  color: #22c55e;
  transform: scale(1.15);
}
.tracks-list li {
  position: relative; /* 6. Añade posicionamiento relativo para el tooltip */
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.tracks-list li:hover:not(.locked) {
  background-color: var(--track-hover-bg, rgba(167, 228, 255, 0.1));
  color: var(--track-hover-text, #a7e4ff);
  box-shadow: 0 0 15px var(--track-hover-bg, rgba(167, 255, 255, 0.2));
  transform: translateX(5px);
}
.track-number {
  color: #888;
  transition: color 0.2s ease-in-out;
}
.track-title {
}
.tracks-list li.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
.lock-icon {
  font-size: 1rem;
}
.gallery-toggle-button {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #eee;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: auto;
  align-self: flex-start;
  transition: background-color 0.2s;
}
.gallery-toggle-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.platform-icons {
  display: flex;
  gap: 0.5rem;
  padding-left: 1rem;
}
.platform-icon-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s ease;
}
.platform-icon-button:hover {
  color: #ffffff;
  transform: scale(1.2);
}
</style>