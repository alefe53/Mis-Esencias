// src/stores/bandStore.ts
import { defineStore } from 'pinia'
import type { Band } from '../types'
import apiPublic from '../services/apiPublic'

export const useBandStore = defineStore('band', {
  state: () => ({
    bands: [] as Band[],
    isLoading: false,
  }),

  actions: {
    async fetchBandsWithReleases() {
      // if (this.bands.length > 0) return; // Mantenlo comentado por ahora

      this.isLoading = true
      try {
        const response = await apiPublic.get('/bands')
        const fetchedBands: Band[] = response.data.data

        // --- INICIO DE LA DEPURACIÓN ---

        // 1. Miremos los datos crudos que llegan de la API
        console.log(
          '1. DATOS CRUDOS RECIBIDOS:',
          JSON.parse(JSON.stringify(fetchedBands)),
        )

        const getLatestReleaseYear = (band: Band): number => {
          if (!band.releases || band.releases.length === 0) {
            return 0
          }
          // Usamos Number() para asegurarnos de que el año sea un número y no un string
          const years = band.releases.map((r) => Number(r.releaseYear) || 0)
          return Math.max(...years)
        }

        fetchedBands.sort((bandA, bandB) => {
          const latestYearA = getLatestReleaseYear(bandA)
          const latestYearB = getLatestReleaseYear(bandB)

          // 2. Miremos qué valores se están comparando en cada iteración del sort
          console.log(
            `2. COMPARANDO: ${bandA.name} (año ${latestYearA}) vs ${bandB.name} (año ${latestYearB})`,
          )

          return latestYearB - latestYearA
        })

        // 3. Miremos cómo quedó el array DESPUÉS de intentar ordenarlo
        console.log(
          '3. ARRAY DESPUÉS DE ORDENAR:',
          JSON.parse(JSON.stringify(fetchedBands)),
        )

        // --- FIN DE LA DEPURACIÓN ---

        this.bands = fetchedBands
      } catch (error) {
        console.error('Error al obtener las bandas:', error)
        this.bands = []
      } finally {
        this.isLoading = false
      }
    },
  },
})
