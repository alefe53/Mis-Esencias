// src/services/profileService.ts
import api from './api';
import type { ProfileUpdatePayload } from '../types';

/**
 * Llama al endpoint del backend para actualizar el perfil del usuario.
 * @param payload - Objeto con los datos a actualizar.
 * @returns La respuesta de la API con el perfil actualizado.
 */
export const updateProfile = async (payload: ProfileUpdatePayload) => {
  const { data } = await api.put('/profile', payload);
  return data;
};