<template>
  <div class="music-with-me-view">
    <div class="main-area">
      <router-link to="/music" class="back-button">&larr; Volver</router-link>
      <div v-if="bandStore.isLoading" class="loader">Cargando bandas...</div>
      <div
        v-else-if="!bandStore.isLoading && bandStore.bands.length === 0"
        class="empty-state"
      >
        No se encontraron bandas.
      </div>
      <div v-else class="content-wrapper">
        <div class="bands-list">
          <div
            v-for="band in bandStore.bands"
            :key="band.id"
            class="band-item band-item-enter"
            :ref="setBandRef"
          >
            <div class="band-header" @click="toggleBand(band.id)">
              <img :src="band.image_url" :alt="band.name" class="band-image" />
              <div class="band-info">
                <h2>{{ band.name }}</h2>
                <p>{{ band.description }}</p>
              </div>
              <span
                class="chevron"
                :class="{ expanded: expandedBandId === band.id }"
                >&#9660;</span
              >
            </div>
            <transition name="expand">
              <div v-if="expandedBandId === band.id" class="releases-grid">
                <div
                  v-for="release in band.releases"
                  :key="release.id"
                  @click="openReleaseModal(release.id)"
                  class="card-wrapper"
                >
                  <ReleaseCard :release="release" />
                </div>
              </div>
            </transition>
          </div>
          <div class="bottom-spacer"></div>
        </div>
      </div>
    </div>
    <ReleaseDetailModal
      v-if="releaseStore.currentReleaseDetails || releaseStore.isLoadingDetails"
      :release="releaseStore.currentReleaseDetails"
      :is-loading="releaseStore.isLoadingDetails"
      @close="releaseStore.clearReleaseDetails()"
    />
  </div>
</template>
<script setup lang="ts">
// ... (El script no necesita cambios)
import { ref, onMounted, watch, onBeforeUpdate } from 'vue'
import { useBandStore } from '../stores/bandStore'
import { useReleaseStore } from '../stores/releaseStore'
import ReleaseCard from '../components/releases/ReleaseCard.vue'
import ReleaseDetailModal from '../components/releases/ReleaseDetailModal.vue'
import gsap from 'gsap'
const bandStore = useBandStore()
const releaseStore = useReleaseStore()
const expandedBandId = ref<number | null>(null)
const bandElements = ref<HTMLElement[]>([])
const setBandRef = (el: any) => {
  if (el) {
    bandElements.value.push(el)
  }
}
onBeforeUpdate(() => {
  bandElements.value = []
})
watch(bandElements, (newBands) => {
  if (newBands && newBands.length > 0) {
    gsap.to(newBands, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.1,
    })
  }
})
onMounted(() => {
  bandStore.fetchBandsWithReleases()
})
function toggleBand(bandId: number) {
  if (expandedBandId.value === bandId) {
    expandedBandId.value = null
  } else {
    expandedBandId.value = bandId
  }
}
function openReleaseModal(releaseId: number) {
  releaseStore.fetchReleaseDetails(releaseId)
}
</script>
<style scoped>
.music-with-me-view {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: flex-start;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}
/* MODIFICADO: Estilo completamente nuevo para el botón */
.back-button {
  align-self: flex-start; /* Se alinea a la izquierda de su contenedor */
  margin-bottom: 2rem; /* Espacio antes del contenido de abajo */
  color: #ccc;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  background-color: rgba(40, 40, 40, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 20px;
}
.back-button:hover {
  color: white;
  background-color: rgba(60, 60, 60, 0.9);
  transform: scale(1.05);
}
.main-area {
  grid-column: 2;
  display: flex; /* MODIFICADO */
  flex-direction: column; /* MODIFICADO */
  align-items: center; /* MODIFICADO */
  width: 100%;
  padding: 3.5rem 50px 0; /* MODIFICADO: Padding ajustado */
  box-sizing: border-box;
  overflow-y: auto;
  height: 100vh;
}
.content-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  /* padding-top: 80px; AHORA SE MANEJA EN .main-area */
  margin: 0 auto;
}
.bottom-spacer {
  height: 35vh;
  width: 100%;
  flex-shrink: 0;
}
.loader,
.empty-state {
  grid-column: 2;
  text-align: center;
  font-size: 1.2rem;
  color: #888;
}
.bands-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%; /* Asegura que ocupe todo el ancho del content-wrapper */
}
.band-item {
  background-color: rgba(25, 25, 25, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}
.band-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1.5rem;
}
.band-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.band-info h2 {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
}
.band-info p {
  margin: 0;
  color: #ccc;
  font-size: 0.9rem;
}
.chevron {
  margin-left: auto;
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}
.chevron.expanded {
  transform: rotate(180deg);
}
.releases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  padding: 0 1.5rem 1.5rem;
}
.card-wrapper {
  width: 100%;
}
.expand-enter-active,
.expand-leave-active {
  transition:
    grid-template-rows 0.4s ease,
    opacity 0.4s ease-in-out;
  transform-origin: top;
}
.expand-enter-from,
.expand-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}
.main-area::-webkit-scrollbar {
  width: 8px;
}
.main-area::-webkit-scrollbar-track {
  background: transparent;
}
.main-area::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.main-area::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
.band-item-enter {
  opacity: 0;
  transform: scale(0.8);
}
@media (max-width: 768px) {
  .music-with-me-view {
    display: block;
  }
  .main-area {
    padding: 2rem 1rem 0; /* MODIFICADO */
  }
  /* MODIFICADO: La regla específica para el botón en móvil ya no es necesaria */
  /* .back-button { ... } */
  .band-header {
    padding: 1rem;
    gap: 1rem;
  }
  .band-image {
    width: 70px;
    height: 70px;
  }
  .band-info h2 {
    font-size: 1.3rem;
    margin-bottom: 0.25rem;
  }
  .band-info p {
    font-size: 0.85rem;
  }
  .releases-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    padding: 0 1rem 1rem;
  }
}
</style>