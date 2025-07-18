<template>
  <transition name="modal-fade">
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="closeModal" aria-label="Cerrar modal">×</button>
        <h2>Galería Privada</h2>
        <div v-if="isLoading" class="loader">Cargando imágenes...</div>
        <div v-else-if="privateGallery.length > 0" class="gallery-grid">
          <div
            v-for="image in privateGallery"
            :key="image.file_path"
            class="gallery-item"
            @click="selectImage(image)"
          >
            <img v-if="image.signedUrl" :src="image.signedUrl" :alt="image.title || 'Foto de la galería'" loading="lazy" />
            <div class="image-info">
              <h3 v-if="image.title">{{ image.title }}</h3>
              <p v-if="image.description">{{ image.description }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No hay imágenes disponibles en este momento.</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useImageStore } from '../../stores/imageStore';
import { storeToRefs } from 'pinia';

const imageStore = useImageStore();
const { isModalOpen, isLoading, privateGallery } = storeToRefs(imageStore);
const { closeModal, selectImage } = imageStore;
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-content {
  background-color: #111827;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #374151;
}
.close-button {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 2.5rem;
  cursor: pointer;
  transition: color 0.2s;
}
.close-button:hover {
  color: white;
}
.modal-content h2 {
  text-align: center;
  margin-bottom: 2rem;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
.gallery-item {
  background-color: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.gallery-item:hover {
  transform: scale(1.03);
}
.gallery-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}
.image-info {
  padding: 1rem;
}
.image-info h3 {
  margin: 0 0 0.5rem 0;
  color: #f3f4f6;
}
.image-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #d1d5db;
}
.loader,
.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #9ca3af;
  font-size: 1.2rem;
}
</style>