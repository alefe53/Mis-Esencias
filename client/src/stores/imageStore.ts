// RUTA: src/stores/imageStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GalleryImage, PrivateGalleryImage } from '../types'
import { fetchPrivateGallery } from '../services/imageService' // 👈 Importamos el servicio

export const useImageStore = defineStore('images', () => {
  // --- STATE ---

  // Para el Lightbox (visor de imagen individual)
  const galleryItems = ref<(GalleryImage | PrivateGalleryImage)[]>([])
  const selectedImage = ref<(GalleryImage | PrivateGalleryImage) | null>(null)

  // Para el Modal de la Galería Privada (la grilla de imágenes)
  const privateGallery = ref<PrivateGalleryImage[]>([])
  const isModalOpen = ref(false)
  const isLoading = ref(false)

  // Para el Toast de "Galería Desbloqueada"
  // Leemos de localStorage para recordar si el usuario ya vio el toast.
  const wasToastViewed = ref(
    localStorage.getItem('galleryToastViewed') === 'true',
  )

  // --- COMPUTED ---

  const currentIndex = computed(() => {
    if (!selectedImage.value || galleryItems.value.length === 0) return -1
    const selectedKey =
      'imageUrl' in selectedImage.value
        ? selectedImage.value.imageUrl
        : selectedImage.value.file_path
    return galleryItems.value.findIndex((img) => {
      const currentKey = 'imageUrl' in img ? img.imageUrl : img.file_path
      return currentKey === selectedKey
    })
  })

  const hasNext = computed(
    () =>
      currentIndex.value >= 0 &&
      currentIndex.value < galleryItems.value.length - 1,
  )
  const hasPrevious = computed(() => currentIndex.value > 0)

  // --- ACTIONS ---

  // 💡 FUNCIÓN NUEVA: Abre el modal de la galería privada
  async function openModal() {
    isModalOpen.value = true
    // Si la galería privada no se ha cargado antes, la pedimos a la API.
    if (privateGallery.value.length === 0) {
      isLoading.value = true
      try {
        privateGallery.value = await fetchPrivateGallery()
      } catch (error) {
        console.error('Error al cargar la galería privada:', error)
        // Aquí podrías manejar el error, por ejemplo, mostrando un mensaje.
      } finally {
        isLoading.value = false
      }
    }
  }

  // 💡 FUNCIÓN NUEVA: Cierra el modal de la galería
  function closeModal() {
    isModalOpen.value = false
  }

  // 💡 FUNCIÓN NUEVA: Marca el toast como visto y lo guarda en localStorage
  function markToastAsViewed() {
    wasToastViewed.value = true
    localStorage.setItem('galleryToastViewed', 'true')
  }

  // 💡 FUNCIÓN NUEVA: Se llama desde la grilla del modal para abrir el lightbox
  function selectImage(image: PrivateGalleryImage) {
    // Usa la función openLightbox que ya tenías para mostrar la imagen seleccionada.
    // El lightbox mostrará todas las imágenes de la galería privada.
    const startIndex = privateGallery.value.findIndex(
      (img) => img.file_path === image.file_path,
    )
    if (startIndex !== -1) {
      openLightbox(privateGallery.value, startIndex)
    }
  }

  // Funciones del Lightbox que ya tenías
  function openLightbox(
    images: (GalleryImage | PrivateGalleryImage)[],
    startIndex: number,
  ) {
    galleryItems.value = images
    selectedImage.value = images[startIndex] || null
  }

  function clearSelectedImage() {
    selectedImage.value = null
    galleryItems.value = []
  }

  function selectNextImage() {
    if (hasNext.value) {
      selectedImage.value = galleryItems.value[currentIndex.value + 1]
    }
  }

  function selectPreviousImage() {
    if (hasPrevious.value) {
      selectedImage.value = galleryItems.value[currentIndex.value - 1]
    }
  }

  return {
    galleryItems,
    selectedImage,
    privateGallery,
    isModalOpen,
    isLoading,
    wasToastViewed,
    hasNext,
    hasPrevious,
    openModal,
    closeModal,
    markToastAsViewed,
    selectImage,
    openLightbox,
    clearSelectedImage,
    selectNextImage,
    selectPreviousImage,
  }
})
