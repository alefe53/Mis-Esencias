<template>
  <div class="works-view">
    <div class="title-container fade-in-item" ref="titleContainer">
      <img src="/sonidoTrabajo.png" alt="Sonido" class="title-image-overlay" />
      <h1 class="title-text">Sonido</h1>
    </div>
    <p class="description fade-in-item" ref="description">
      Proyectos Laborales Musicales, de todos los colores. Aquí algunos
      destacados. ¡Contactame para estar entre ellos!
    </p>

    <div v-if="isLoadingProjects" class="loader">Cargando proyectos...</div>
    <div
      v-else-if="projects.length > 0"
      class="projects-grid fade-in-item"
      ref="projectsGrid"
    >
      <router-link
        v-for="(project, index) in projects"
        :key="project.id"
        :to="`/trabajos/${project.id}`"
        class="project-item"
        :style="{ '--animation-delay': `${index * 0.1}s` }"
      >
        <img
          :src="project.cover_art_url"
          :alt="project.artist_or_band_name"
          class="project-cover"
        />
        <span class="project-name">{{ project.artist_or_band_name }}</span>
      </router-link>
    </div>
    <div v-else class="no-projects">No se encontraron proyectos.</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEngineeringStore } from '../stores/engineeringStore'
import { useFadeInAnimation } from '../composables/useFadeInAnimation'

const engineeringStore = useEngineeringStore()
const { projects, isLoadingProjects } = storeToRefs(engineeringStore)

const titleContainer = ref(null)
const description = ref(null)
const projectsGrid = ref(null)

useFadeInAnimation([titleContainer, description, projectsGrid])

onMounted(() => {
  engineeringStore.fetchProjects()
})
</script>

<style scoped>
@keyframes levitate {
  0%,
  100% {
    transform: translateY(0);
    box-shadow:
      0 10px 20px rgba(0, 0, 0, 0.2),
      0 6px 6px rgba(0, 0, 0, 0.23);
  }
  50% {
    transform: translateY(-10px);
    box-shadow:
      0 14px 28px rgba(0, 0, 0, 0.25),
      0 10px 10px rgba(0, 0, 0, 0.22);
  }
}
.works-view {
  padding: 4rem 2rem;
  text-align: center;
  color: #fff;
  max-width: 1200px;
  margin: 0 auto;
}
.title-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}
.title-text {
  font-size: 5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5rem;
}
.title-image-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  opacity: 0.6;
  mix-blend-mode: screen;
  pointer-events: none;
}
.description {
  font-size: 1.2rem;
  color: #ccc;
  margin-bottom: 4rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem 2rem;
  justify-items: center;
}
.project-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #fff;
  transition: transform 0.3s ease;
}
.project-item:hover {
  transform: scale(1.05);
}
.project-cover {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  background-color: #333;
  animation: levitate 5s ease-in-out infinite;
  animation-delay: var(--animation-delay, 0s);
}
.project-name {
  margin-top: 1rem;
  font-weight: 500;
}
@media (max-width: 900px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
.project-item:hover .project-cover {
  animation-play-state: paused;
}
@media (min-width: 901px) {
  .projects-grid:has(.project-item:nth-child(4):last-child)
    .project-item:nth-child(4) {
    grid-column: 2;
  }
  .projects-grid:has(.project-item:nth-child(5):last-child) {
    grid-template-columns: repeat(6, 1fr);
  }
  .projects-grid:has(.project-item:nth-child(5):last-child)
    .project-item:nth-child(1) {
    grid-column: 1 / 3;
  }
  .projects-grid:has(.project-item:nth-child(5):last-child)
    .project-item:nth-child(2) {
    grid-column: 3 / 5;
  }
  .projects-grid:has(.project-item:nth-child(5):last-child)
    .project-item:nth-child(3) {
    grid-column: 5 / 7;
  }
  .projects-grid:has(.project-item:nth-child(5):last-child)
    .project-item:nth-child(4) {
    grid-column: 2 / 4;
  }
  .projects-grid:has(.project-item:nth-child(5):last-child)
    .project-item:nth-child(5) {
    grid-column: 4 / 6;
  }
}
.loader,
.no-projects {
  font-size: 1.5rem;
  margin-top: 5rem;
}
.fade-in-item {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}
</style>
