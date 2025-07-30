// src/repositories/profileRepository.js

import { supabase } from "../config/supabase.js";
import { supabase as supabaseAdmin } from "../config/supabase.js";


export async function getProfileById(userId) {
	const { data, error } = await supabase.rpc("get_user_profile_by_id", {
		p_user_id: userId,
	});

	if (error) {
		console.error("Error en el repositorio al obtener perfil:", error.message);
		throw new Error("No se pudo obtener el perfil del usuario.");
	}

	return data && data.length > 0 ? data[0] : null;
}

export async function updateProfile(userId, profileData) {
    const { data, error } = await supabase.rpc("update_user_profile_by_id", {
        p_user_id: userId,
        p_first_name: profileData.first_name,
        p_last_name: profileData.last_name,
        p_birth_date: profileData.birth_date,
    });

    if (error) {
        console.error("Error en RPC al actualizar perfil:", error.message);
        throw new Error("No se pudo actualizar el perfil.");
    }

    return data;
}

export async function updateAvatar(userId, avatarUrl) {
    const { data, error } = await supabase.rpc('update_user_avatar', {
        p_user_id: userId,
        p_avatar_url: avatarUrl
    });

    if (error) {
        console.error("Error en RPC al actualizar avatar:", error.message);
        throw new Error("No se pudo guardar la nueva imagen de perfil.");
    }
    
    return data && data.length > 0 ? data[0] : null;
}

export const updatePasswordInDB = async (userId, newPassword) => {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    );

    if (error) {
        console.error("Error al actualizar contraseña en Supabase:", error);
        throw new Error("No se pudo actualizar la contraseña.");
    }
    return data;
};