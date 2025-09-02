// src/services/profileService.ts
import api from './api'
import type { ProfileUpdatePayload } from '../types'

/**
 * Llama al endpoint del backend para actualizar el perfil del usuario.
 * @param payload - Objeto con los datos a actualizar.
 * @returns La respuesta de la API con el perfil actualizado.
 */
export const updateProfile = async (payload: ProfileUpdatePayload) => {
  const { data } = await api.put('/profile', payload)
  return data
}

export const getProfile = async () => {
  const { data } = await api.get('/profile')
  return data
}

export const uploadAvatar = async (avatarFile: File) => {
  const formData = new FormData()
  formData.append('avatar', avatarFile)

  const { data } = await api.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}

export const updatePassword = async (newPassword: string) => {
  const { data } = await api.post('/profile/password', { newPassword })
  return data
}
