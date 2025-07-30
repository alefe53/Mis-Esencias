<template>
  <div class="project-detail-view">
    <div v-if="isLoadingDetails" class="loader">Cargando...</div>

    <div v-else-if="project" class="content">
      <div class="project-header">
        <img
          :src="project.cover_art_url"
          :alt="project.artist_or_band_name"
          class="project-cover-large"
        />
        <h1>{{ project.artist_or_band_name }}</h1>
        <p v-if="project.description">{{ project.description }}</p>
      </div>

      <h2 class="releases-title">Lanzamientos Asociados</h2>
      <div class="releases-grid">
        <div
          v-for="release in project.releases"
          :key="release.id"
          class="release-item-wrapper"
        >
          <ReleaseCard
            :release="release"
            @click="openReleaseModal(release.id)"
          />
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <h2>Proyecto no encontrado</h2>
      <router-link to="/trabajos">Volver a Trabajos</router-link>
    </div>
  </div>

  <ReleaseDetailModal
    v-if="isModalVisible"
    :is-loading="isLoadingReleaseDetails"
    :release="currentReleaseDetails"
    @close="closeReleaseModal"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useEngineeringStore } from '../stores/engineeringStore'
import { useReleaseStore } from '../stores/releaseStore'
import ReleaseCard from '../components/releases/ReleaseCard.vue'
import ReleaseDetailModal from '../components/releases/ReleaseDetailModal.vue'

const route = useRoute()
const engineeringStore = useEngineeringStore()
const releaseStore = useReleaseStore()

const { currentProjectDetails: project, isLoadingDetails } =
  storeToRefs(engineeringStore)
const { currentReleaseDetails, isLoadingDetails: isLoadingReleaseDetails } =
  storeToRefs(releaseStore)

const isModalVisible = ref(false)

const openReleaseModal = (releaseId: number) => {
  releaseStore.fetchReleaseDetails(releaseId)
  isModalVisible.value = true
}

const closeReleaseModal = () => {
  isModalVisible.value = false
  releaseStore.clearReleaseDetails()
}

onMounted(() => {
  const projectId = Number(route.params.id)
  if (projectId) {
    engineeringStore.fetchProjectDetails(projectId)
  }
})
</script>

<style scoped>
.project-detail-view {
  padding: 4rem 2rem;
  padding-bottom: 250px;
  max-width: 1100px;
  margin: 0 auto;
  color: #fff;
}
.project-header {
  text-align: center;
  margin-bottom: 4rem;
}
.project-cover-large {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1.5rem;
  border: 4px solid rgba(255, 255, 255, 0.5);
}
.project-header h1 {
  font-size: 2.5rem;
}
.project-header p {
  font-size: 1.1rem;
  color: #ccc;
  max-width: 600px;
  margin: 1rem auto 0;
}
.releases-title {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #444;
  padding-bottom: 1rem;
}
.releases-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}
.release-item-wrapper {
  width: 420px;
}
.releases-grid :deep(img) {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 4px;
}
.loader,
.not-found {
  text-align: center;
  margin-top: 5rem;
  font-size: 1.5rem;
}
.not-found a {
  color: #a7e4ff;
  font-size: 1rem;
}
</style>
