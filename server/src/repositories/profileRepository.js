// src/repositories/profileRepository.js

import { supabase } from '../config/supabase.js';

export async function getProfileById(userId) {
  const { data, error } = await supabase.rpc('get_user_profile_by_id', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error en el repositorio al obtener perfil:', error.message);
    throw new Error('No se pudo obtener el perfil del usuario.');
  }

  return data && data.length > 0 ? data[0] : null;
}

export async function updateProfile(profileData) {
  const { data, error } = await supabase.rpc('update_user_profile', {
    p_first_name: profileData.first_name,
    p_last_name: profileData.last_name,
    p_birth_date: profileData.birth_date,
  });

  if (error) {
    console.error('Error en RPC al actualizar perfil:', error.message);
    throw new Error('No se pudo actualizar el perfil.');
  }

  return data && data.length > 0 ? data[0] : null;
}