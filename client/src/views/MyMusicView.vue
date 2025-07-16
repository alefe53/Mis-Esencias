<template>
  <div class="my-music-view">
    <router-link to="/music" class="back-button">&larr; Volver</router-link>

    <div class="main-area">
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
// El <script setup> se mantiene exactamente igual
import { ref, onMounted, computed } from "vue";
import { useReleaseStore } from "../stores/releaseStore";
import ReleaseCard from "../components/releases/ReleaseCard.vue";
import ReleaseDetailModal from "../components/releases/ReleaseDetailModal.vue";

const store = useReleaseStore();
const isHovering = ref(false);

const isCarouselMode = computed(() => store.myReleases.length > 4);

const duplicatedReleases = computed(() => {
  if (isCarouselMode.value) {
    return [...store.myReleases, ...store.myReleases];
  }
  return [];
});

const carouselStyle = computed(() => {
  const baseSpeed = 5;
  const duration = store.myReleases.length * baseSpeed;
  return {
    "--item-count": store.myReleases.length,
    "animation-duration": `${duration}s`,
  };
});

onMounted(() => {
  store.fetchMyReleases();
});

function openDetails(id: number) {
  store.fetchReleaseDetails(id);
}
</script>

<style scoped>
.my-music-view {
  min-height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 2. ESTILOS ACTUALIZADOS PARA EL BOTÓN "VOLVER" */
.back-button {
  position: fixed; /* Lo fijamos a la ventana */
  top: 2rem;
  left: 3rem; /* Lo movemos para que quede sobre el menú */
  color: #ccc;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  background-color: rgba(40, 40, 40, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  z-index: 1100; /* Aseguramos que esté por encima de otros elementos */
}

.back-button:hover {
  color: white;
  background-color: rgba(60, 60, 60, 0.9);
  transform: scale(1.05);
}

.main-area {
  grid-column: 2;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 50px 160px; /* Ajustamos padding para no tener espacio extra arriba */
  box-sizing: border-box;
}

.content-wrapper {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  padding-top: 5rem; /* 3. AÑADIMOS PADDING SUPERIOR para que el contenido no quede debajo del botón */
}

/* 4. ELIMINAMOS .header-section PORQUE YA NO SE USA */
/* .header-section { ... } */

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
</style>