// src/services/profileService.js

import axios from 'axios';
import { supabase } from '../config/supabase.js'; // Usaremos el cliente admin que ya está configurado aquí
import { config } from '../config/config.js';
import * as profileRepository from '../repositories/profileRepository.js';

async function uploadAvatarToStorage(userId, buffer, contentType) {
    const filePath = `users/${userId}/avatar.jpg`;
    const { data, error } = await supabase.storage
        .from(config.supabase.buckets.PUBLIC)
        .upload(filePath, buffer, {
            contentType,
            upsert: true,
        });

    if (error) {
        console.error(`Error al subir avatar para ${userId}:`, error.message);
        throw new Error('No se pudo subir la imagen del avatar.');
    }
    return data.path; // Retorna la ruta relativa: 'users/userId/avatar.jpg'
}

export async function updateAvatar(userId, source) {
    let imageBuffer;
    let imageContentType;

    if (source.url) {
        try {
            const response = await axios.get(source.url, { responseType: 'arraybuffer' });
            imageBuffer = response.data;
            imageContentType = response.headers['content-type'];
        } catch (error) {
            console.error(`Error procesando el avatar desde URL para ${userId}:`, error.message);
            return profileRepository.getProfileById(userId);
        }
    } else if (source.buffer) {
        imageBuffer = source.buffer;
        imageContentType = source.contentType;
    } else {
        throw new Error('Fuente de avatar no válida.');
    }

    // 1. Subimos la imagen a Storage como siempre.
    const relativePath = await uploadAvatarToStorage(userId, imageBuffer, imageContentType);

    // 2. [PASO CLAVE] Construimos la URL pública completa de la nueva imagen.
    // Supabase Auth necesita la URL completa, no la ruta relativa.
    const { data: { publicUrl } } = supabase.storage
        .from(config.supabase.buckets.PUBLIC)
        .getPublicUrl(relativePath);
    
    if (!publicUrl) {
        throw new Error('No se pudo generar la URL pública para el nuevo avatar.');
    }

    // 3. [PASO CLAVE] Actualizamos los metadatos en Supabase Auth con la URL completa.
    // Usamos el cliente con permisos de 'service_role' (admin).
    const { error: authUserError } = await supabase.auth.admin.updateUserById(
        userId,
        {
            data: { avatar_url: publicUrl } // Sincronizamos el avatar en auth.users
        }
    );

    if (authUserError) {
        console.error(`Error sincronizando el avatar en Supabase Auth para ${userId}:`, authUserError.message);
        // Si esto falla, podríamos decidir si revertir la subida o solo registrar el error.
        // Por ahora, lanzamos un error para saber que algo falló.
        throw new Error('No se pudo sincronizar el nuevo avatar con el sistema de autenticación.');
    }
    
    console.log(`Avatar sincronizado en Supabase Auth para el usuario ${userId} con la URL: ${publicUrl}`);

    // 4. Actualizamos nuestra tabla `profiles` con la ruta relativa (esto es una buena práctica).
    const updatedProfile = await profileRepository.updateAvatar(userId, relativePath);
    
    return updatedProfile;
}

// --- El resto de las funciones de tu servicio ---

export async function getUserProfile(userId) {
    const profile = await profileRepository.getProfileById(userId);
    if (!profile) {
        throw new Error('Perfil no encontrado.');
    }
    return profile;
}

export async function updateUserProfile(userId, dataToUpdate) {
    return profileRepository.updateProfile(userId, dataToUpdate);
}

export const updateUserPassword = async (userId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres.');
        error.statusCode = 400;
        throw error;
    }
    return profileRepository.updatePasswordInDB(userId, newPassword);
};