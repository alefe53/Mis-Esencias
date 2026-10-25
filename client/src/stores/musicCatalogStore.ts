// stores/musicCatalogStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Track } from '../types'
import api from '../services/api'

export const useMusicCatalogStore = defineStore('musicCatalog', () => {
  const catalog = ref<Track[]>([])
  const isLoading = ref(false)

  async function fetchCatalog() {
    if (catalog.value.length > 0 || isLoading.value) return

    isLoading.value = true
    try {
      const response = await api.get('/tracks/catalog')
      catalog.value = response.data.data
    } catch (error) {
      console.error('Error al obtener el catálogo de música:', error)
      catalog.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    catalog,
    isLoading,
    fetchCatalog,
  }
})
