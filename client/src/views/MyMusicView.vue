<template>
  <div class="my-music-view">
    <div class="main-area">
      <router-link to="/music" class="back-button">&larr; Volver</router-link>
      <div v-if="store.isLoadingList" class="loader">Cargando álbumes...</div>
      <div
        v-else-if="!store.isLoadingList && store.myReleases.length === 0"
        class="empty-state"
      >
        No se encontraron lanzamientos.
      </div>
      <div v-else class="content-wrapper">
        <div
          v-if="isCarouselMode"
          class="carousel-container"
          @mouseover="isHovering = true"
          @mouseleave="isHovering = false"
        >
          <div
            class="carousel-track"
            :style="carouselStyle"
            :class="{ paused: isHovering }"
          >
            <div
              v-for="(release, index) in duplicatedReleases"
              :key="`${release.id}-${index}`"
              @click="openDetails(release.id)"
              class="card-wrapper"
              :ref="setCardRef"
            >
              <ReleaseCard :release="release" />
            </div>
          </div>
        </div>
        <div v-else class="releases-grid">
          <div
            v-for="release in store.myReleases"
            :key="release.id"
            @click="openDetails(release.id)"
            class="card-wrapper"
            :ref="setCardRef"
          >
            <ReleaseCard :release="release" />
          </div>
        </div>
      </div>
    </div>
    <ReleaseDetailModal
      v-if="store.currentReleaseDetails || store.isLoadingDetails"
      :release="store.currentReleaseDetails"
      :is-loading="store.isLoadingDetails"
      @close="store.clearReleaseDetails()"
    />
  </div>
</template>

<script setup lang="ts">
// ... (El script no necesita cambios)
import {
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  onBeforeUpdate,
  onActivated,
} from 'vue'
import { useReleaseStore } from '../stores/releaseStore'
import ReleaseCard from '../components/releases/ReleaseCard.vue'
import ReleaseDetailModal from '../components/releases/ReleaseDetailModal.vue'
import gsap from 'gsap'

const store = useReleaseStore()
const isHovering = ref(false)
const cardElements = ref<HTMLElement[]>([])

const setCardRef = (el: any) => {
  if (el) {
    cardElements.value.push(el)
  }
}

onBeforeUpdate(() => {
  cardElements.value = []
})

const runEnterAnimation = (elements: HTMLElement[]) => {
  if (elements && elements.length > 0) {
    gsap.set(elements, { opacity: 0, scale: 0.8 })
    gsap.to(elements, {
      opacity: 1,
      scale: 1,
      duration: 2,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.2,
    })
  }
}

watch(cardElements, (newCards) => {
  runEnterAnimation(newCards)
})

onActivated(() => {
  runEnterAnimation(cardElements.value)
})

const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

const isCarouselMode = computed(
  () => store.myReleases.length > 4 && !isMobile.value,
)

const duplicatedReleases = computed(() => {
  if (isCarouselMode.value) {
    return [...store.myReleases, ...store.myReleases]
  }
  return []
})

const carouselStyle = computed(() => {
  const baseSpeed = 5
  const duration = store.myReleases.length * baseSpeed + 1
  return {
    '--item-count': store.myReleases.length,
    'animation-duration': `${duration}s`,
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  store.fetchMyReleases()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function openDetails(id: number) {
  store.fetchReleaseDetails(id)
}
</script>

<style scoped>
.my-music-view {
  min-height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: flex-start; /* MODIFICADO: para alinear el contenido arriba */
  overflow-x: hidden;
  box-sizing: border-box;
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
  display: flex;
  flex-direction: column; /* Para apilar el botón y el contenido */
  align-items: center; /* Centra el .content-wrapper horizontalmente */
  width: 100%;
  padding: 3.5rem 50px 160px; /* MODIFICADO: padding arriba para espacio */
  box-sizing: border-box;
}
.content-wrapper {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  /* padding-top: 5rem; AHORA SE MANEJA EN .main-area */
}
.loader,
.empty-state {
  grid-column: 2;
  text-align: center;
  font-size: 1.2rem;
  color: #888;
}
.releases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2.5rem;
  width: 100%;
  box-sizing: border-box;
}
.carousel-container {
  width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}
.carousel-track {
  display: flex;
  gap: 2.5rem;
  width: calc(var(--item-count) * (220px + 2.5rem) * 2);
  animation-name: scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.carousel-track.paused {
  animation-play-state: paused;
}
@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.card-wrapper {
  flex-shrink: 0;
  width: 220px;
}
@media (max-width: 768px) {
  .my-music-view {
    display: block;
  }
  .main-area {
    padding: 2rem 1.5rem 120px; /* MODIFICADO: Ajuste de padding para móvil */
  }
  /* MODIFICADO: La regla específica para el botón en móvil ya no es necesaria */
  /* .back-button { ... } */

  .releases-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
    align-items: start;
  }
  .card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
  .releases-grid .card-wrapper :deep(img) {
    width: 120px;
    height: 120px;
    object-fit: cover;
    display: block;
    margin: 0 auto 0.5rem;
    border-radius: 8px;
  }
  .releases-grid .card-wrapper :deep(h2),
  .releases-grid .card-wrapper :deep(h3),
  .releases-grid .card-wrapper :deep(p) {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
  }
}
@media (max-width: 400px) {
  .releases-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
</style>
