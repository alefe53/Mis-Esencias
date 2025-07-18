// src/stores/imageStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as imageService from '../services/imageService';
import type { PrivateGalleryImage } from '../types';

const TOAST_STORAGE_KEY = 'misEsencias_galleryToastViewed';

export const useImageStore = defineStore('images', () => {
    const privateGallery = ref<PrivateGalleryImage[]>([]);
    const isModalOpen = ref(false);
    const isLoading = ref(false);
    const wasToastViewed = ref(JSON.parse(localStorage.getItem(TOAST_STORAGE_KEY) || 'false'));

    const selectedImage = ref<PrivateGalleryImage | null>(null);

    const currentIndex = computed(() => {
        if (!selectedImage.value) return -1;
        return privateGallery.value.findIndex(img => img.file_path === selectedImage.value?.file_path);
    });

    const hasNext = computed(() => currentIndex.value < privateGallery.value.length - 1);
    const hasPrevious = computed(() => currentIndex.value > 0);

    async function loadPrivateGallery() {
        if (isLoading.value || privateGallery.value.length > 0) return;
        isLoading.value = true;
        try {
            privateGallery.value = await imageService.fetchPrivateGallery();
        } catch (error) {
            console.error("Error al cargar la galería privada:", error);
        } finally {
            isLoading.value = false;
        }
    }

    function openModal() {
        isModalOpen.value = true;
        loadPrivateGallery();
    }

    function closeModal() {
        isModalOpen.value = false;
    }

    function markToastAsViewed() {
        if (!wasToastViewed.value) {
            localStorage.setItem(TOAST_STORAGE_KEY, 'true');
            wasToastViewed.value = true;
        }
    }

    function selectImage(image: PrivateGalleryImage) {
        selectedImage.value = image;
    }

    function clearSelectedImage() {
        selectedImage.value = null;
    }

    function selectNextImage() {
        if (hasNext.value) {
            selectedImage.value = privateGallery.value[currentIndex.value + 1];
        }
    }

    function selectPreviousImage() {
        if (hasPrevious.value) {
            selectedImage.value = privateGallery.value[currentIndex.value - 1];
        }
    }


    return {
        privateGallery,
        isModalOpen,
        isLoading,
        wasToastViewed,
        selectedImage, 
        hasNext,     
        hasPrevious,
        openModal,
        closeModal,
        markToastAsViewed,
        selectImage,        
        clearSelectedImage,
        selectNextImage,
        selectPreviousImage,
    };
});