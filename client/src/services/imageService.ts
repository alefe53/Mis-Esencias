// src/services/imageService.ts
import api from './api'
import type { PrivateGalleryImage } from '../types'

export const fetchPrivateGallery = async (): Promise<PrivateGalleryImage[]> => {
  const { data } = await api.get('/images/private-gallery')
  return data.data
}
