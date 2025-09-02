//  src/stores/releaseStore.ts
import { defineStore } from 'pinia'
import api from '../services/api'
import type { ReleaseSummary, ReleaseDetails } from '../types'

export const useReleaseStore = defineStore('releases', {
  state: () => ({
    myReleases: [] as ReleaseSummary[],
    currentReleaseDetails: null as ReleaseDetails | null,
    isLoadingList: false,
    isLoadingDetails: false,
  }),

  actions: {
    async fetchMyReleases() {
      if (this.myReleases.length > 0) return
      this.isLoadingList = true
      try {
        const response = await api.get('/releases/my-music')
        this.myReleases = response.data.data
      } catch (error) {
        console.error('Error al cargar mis lanzamientos:', error)
      } finally {
        this.isLoadingList = false
      }
    },

    async fetchReleaseDetails(releaseId: number) {
      this.isLoadingDetails = true
      this.currentReleaseDetails = null
      try {
        const response = await api.get(`/releases/${releaseId}`)
        this.currentReleaseDetails = response.data.data
      } catch (error) {
        console.error(
          `Error al cargar detalles del release ${releaseId}:`,
          error,
        )
      } finally {
        this.isLoadingDetails = false
      }
    },

    clearReleaseDetails() {
      this.currentReleaseDetails = null
    },
  },
})
