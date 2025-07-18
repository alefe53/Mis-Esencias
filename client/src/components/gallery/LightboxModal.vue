<template>
  <transition name="lightbox-fade">
    <div v-if="selectedImage" class="lightbox-overlay" @click="clearSelectedImage">
      <button class="close-lightbox" @click.stop="clearSelectedImage" aria-label="Cerrar imagen">×</button>
      
      <button v-if="hasPrevious" class="nav-button prev" @click.stop="selectPreviousImage" aria-label="Imagen anterior">‹</button>
      <button v-if="hasNext" class="nav-button next" @click.stop="selectNextImage" aria-label="Siguiente imagen">›</button>

      <div class="lightbox-content" @click.stop>
        <div class="image-container">
            <img v-if="selectedImage.signedUrl" :src="selectedImage.signedUrl" :alt="selectedImage.title || ''" />
        </div>
        <div v-if="selectedImage.title || selectedImage.description" class="lightbox-info">
          <h3 v-if="selectedImage.title">{{ selectedImage.title }}</h3>
          <p v-if="selectedImage.description">{{ selectedImage.description }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useImageStore } from '../../stores/imageStore';
import { storeToRefs } from 'pinia';

const imageStore = useImageStore();
const { selectedImage, hasNext, hasPrevious } = storeToRefs(imageStore);
const { clearSelectedImage, selectNextImage, selectPreviousImage } = imageStore;

const handleKeydown = (e: KeyboardEvent) => {
  if (!selectedImage.value) return;
  if (e.key === 'Escape') clearSelectedImage();
  if (e.key === 'ArrowRight') selectNextImage();
  if (e.key === 'ArrowLeft') selectPreviousImage();
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<style scoped>
.lightbox-fade-enter-active, .lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}
.lightbox-fade-enter-from, .lightbox-fade-leave-to {
  opacity: 0;
}
.lightbox-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2001; /* Un z-index más alto que el modal principal */
}
.lightbox-content {
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
}
.image-container {
  flex-shrink: 1;
  text-align: center;
}
.image-container img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 4px;
}
.lightbox-info {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 1rem;
  margin-top: 1rem;
  max-width: 80ch;
  text-align: center;
}
.close-lightbox {
  position: absolute;
  top: 1rem; right: 1.5rem;
  font-size: 3rem;
  color: #ccc;
  background: none;
  border: none;
  cursor: pointer;
}
.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 4rem;
  color: #ccc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2rem;
  transition: color 0.2s;
}
.nav-button:hover {
  color: white;
}
.prev { left: 0; }
.next { right: 0; }
</style>