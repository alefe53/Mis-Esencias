// RUTA: src/services/trackService.ts

import api from './api'

export async function getPlayableUrl(
  filePath: string,
  requiredTierId: number | null,
): Promise<string | null> {
  try {
    const response = await api.post('/tracks/playable-url', {
      filePath,
      requiredTierId: requiredTierId || 1,
    })
    return response.data.playableUrl
  } catch (error) {
    console.error('Error al obtener la URL reproducible:', error)
    return null
  }
}
