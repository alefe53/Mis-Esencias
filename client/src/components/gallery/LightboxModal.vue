<template>
  <transition name="lightbox-fade">
    <div
      v-if="displayImage"
      class="lightbox-overlay"
      @click="clearSelectedImage"
    >
      <button
        class="close-lightbox"
        @click.stop="clearSelectedImage"
        aria-label="Cerrar imagen"
      >
        ×
      </button>

      <button
        v-if="hasPrevious"
        class="nav-button prev"
        @click.stop="selectPreviousImage"
        aria-label="Imagen anterior"
      >
        ‹
      </button>
      <button
        v-if="hasNext"
        class="nav-button next"
        @click.stop="selectNextImage"
        aria-label="Siguiente imagen"
      >
        ›
      </button>

      <div class="lightbox-content" @click.stop>
        <div class="image-container">
          <img
            v-if="displayImage.url"
            :src="displayImage.url"
            :alt="displayImage.description"
            class="lightbox-image"
            :key="displayImage.key"
          />
        </div>
        <p v-if="displayImage.description" class="lightbox-description">
          {{ displayImage.description }}
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageStore } from '../../stores/imageStore'

const imageStore = useImageStore()

const { selectedImage, hasNext, hasPrevious } = storeToRefs(imageStore)
const { clearSelectedImage, selectNextImage, selectPreviousImage } = imageStore

const displayImage = computed(() => {
  const image = selectedImage.value
  if (!image) return null

  if ('signedUrl' in image) {
    return {
      url: image.signedUrl,
      description: image.description || image.title || 'Imagen privada',
      key: image.file_path,
    }
  }

  if ('imageUrl' in image) {
    return {
      url: image.imageUrl,
      description: image.description || 'Imagen de la galería',
      key: image.imageUrl,
    }
  }

  return null
})
</script>

<style scoped>
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2001;
}

.lightbox-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
}

.image-container {
  flex-shrink: 1;
  text-align: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.lightbox-description {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 1rem;
  margin-top: 1rem;
  max-width: 80ch;
  text-align: center;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.6;
}

.close-lightbox {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 3rem;
  color: #ccc;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-lightbox:hover {
  color: white;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 4rem;
  font-weight: 100;
  line-height: 1;
  color: #ccc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 1rem 2rem;
  transition:
    color 0.2s,
    background-color 0.2s;
  user-select: none;
}

.nav-button:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.prev {
  left: 0;
}

.next {
  right: 0;
}
</style>
