<template>
  <div class="music-with-me-view">
    <router-link to="/music" class="back-button">&larr; Volver</router-link>

    <div class="main-area">
      <div v-if="bandStore.isLoading" class="loader">Cargando bandas...</div>
      <div
        v-else-if="!bandStore.isLoading && bandStore.bands.length === 0"
        class="empty-state"
      >
        No se encontraron bandas.
      </div>

      <div v-else class="content-wrapper">
        <div class="bands-list">
          <div v-for="band in bandStore.bands" :key="band.id" class="band-item">
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
// Tu <script setup> se mantiene exactamente igual
import { ref, onMounted } from 'vue'
import { useBandStore } from '../stores/bandStore'
import { useReleaseStore } from '../stores/releaseStore'
import ReleaseCard from '../components/releases/ReleaseCard.vue'
import ReleaseDetailModal from '../components/releases/ReleaseDetailModal.vue'

const bandStore = useBandStore()
const releaseStore = useReleaseStore()
const expandedBandId = ref<number | null>(null)

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

.back-button {
  position: fixed;
  top: 2rem;
  left: 3rem;
  color: #ccc;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  background-color: rgba(40, 40, 40, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  z-index: 1100;
}

.back-button:hover {
  color: white;
  background-color: rgba(60, 60, 60, 0.9);
  transform: scale(1.05);
}

.main-area {
  grid-column: 2;
  justify-content: center;
  width: 100%;
  padding: 0 50px; /* Quitamos el padding vertical de aquí */
  box-sizing: border-box;
  overflow-y: auto;
  height: 100vh;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  padding-top: 80px; /* Espacio para que el primer item no quede debajo del botón */
  margin: 0 auto; /* Centramos el content-wrapper */
}

/* 2. AÑADIMOS LOS ESTILOS PARA EL NUEVO ESPACIADOR */
.bottom-spacer {
  height: 35vh; /* Un 35% de la altura de la pantalla como espacio extra */
  width: 100%;
  flex-shrink: 0;
}

/* El resto de tus estilos permanecen igual */
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
  cursor: pointer;
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
</style>
