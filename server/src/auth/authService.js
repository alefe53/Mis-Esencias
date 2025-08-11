import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import axios from "axios"; // <-- Importamos axios
import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";
import * as profileService from '../services/profileService.js'; 

// --- Helper para la lógica del avatar ---
/**
 * Procesa el avatar de Google. Si es una URL de imagen real, la descarga y
 * la sube al bucket de Supabase. Si no, devuelve la ruta al avatar por defecto.
 * @param {string} userId - El ID del usuario.
 * @param {string | null} googleAvatarUrl - La URL del avatar que provee Google.
 * @returns {Promise<string>} - La ruta final del archivo en el bucket.
 */
async function processGoogleAvatar(userId, googleAvatarUrl) {
    const defaultAvatarPath = 'perfildefault.jpg';

    // Si no hay URL o es la imagen de la letra por defecto, usamos el nuestro.
    if (!googleAvatarUrl || googleAvatarUrl.includes('=s96-c')) {
        return defaultAvatarPath;
    }

    try {
        // Descargamos la imagen como un buffer de datos
        const response = await axios.get(googleAvatarUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        // Definimos la ruta donde se guardará en el bucket
        const filePath = `users/${userId}/avatar.jpg`;

        // Subimos la imagen a Supabase Storage
        const { data, error } = await supabase.storage
            .from(config.supabase.buckets.PUBLIC)
            .upload(filePath, response.data, {
                contentType: contentType,
                upsert: true, // Sobrescribe la imagen si ya existe
            });

        if (error) {
            console.error(`Error subiendo el avatar de Google para el usuario ${userId}:`, error.message);
            return defaultAvatarPath; // Si falla la subida, usamos el default
        }

        // Si la subida es exitosa, devolvemos la nueva ruta
        return data.path;

    } catch (error) {
        console.error(`Error descargando el avatar de Google para el usuario ${userId}:`, error.message);
        return defaultAvatarPath; // Si falla la descarga, usamos el default
    }
}


class AuthService {
    async register({ email, password, firstName, lastName }) {
        const tempAuthClient = createClient(
            config.supabase.URL,
            config.supabase.ANON_KEY,
        );
        const { data, error } = await tempAuthClient.auth.signUp({
            email, password, options: { data: { first_name: firstName, last_name: lastName } },
        });
        if (error) {
            if (error.message.includes("User already registered")) throw new Error("Este email ya está registrado.");
            throw new Error("No se pudo completar el registro.");
        }
        return data;
    }

    async login({ email, password }) {
        const tempAuthClient = createClient(config.supabase.URL, config.supabase.ANON_KEY);
        const { data: authData, error } = await tempAuthClient.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email o contraseña incorrectos.");

        const { data: profile, error: profileError } = await supabase.rpc("get_user_profile_id", { p_user_id: authData.user.id }).single();
        if (profileError || !profile) throw new Error("No se pudo recuperar el perfil del usuario.");

        const userPayload = {
            sub: profile.id, id: profile.id, email: authData.user.email,
            subscription_tier_id: profile.subscription_tier_id,
            first_name: profile.first_name, last_name: profile.last_name,
            avatar_url: profile.avatar_url,
        };
        const token = jwt.sign(userPayload, config.jwt.SECRET, { expiresIn: config.jwt.EXPIRES_IN });
        return { token, user: userPayload };
    }


    async handleGoogleLogin(supabaseToken) {
        // 1. Verificamos el token para obtener el usuario de Supabase Auth
        const { data: { user: supabaseUser }, error: userError } =
            await supabase.auth.getUser(supabaseToken);
    
        if (userError || !supabaseUser) {
            console.error("Error al verificar token de Supabase:", userError?.message);
            throw new Error("Token de Supabase inválido o expirado.");
        }
    
        // 2. Usamos el servicio unificado para procesar y subir el avatar
        await profileService.updateAvatar(supabaseUser.id, {
            url: supabaseUser.user_metadata.avatar_url
        });
        
        // 3. Obtenemos el perfil ya actualizado para crear nuestro token
        const { data: profile, error: profileError } = await supabase
            .rpc("get_user_profile_id", { p_user_id: supabaseUser.id })
            .single();

        if (profileError || !profile) {
            throw new Error("No se pudo recuperar el perfil final del usuario.");
        }
    
        // 4. Creamos nuestro propio token JWT con la información completa y correcta
        const userPayload = {
            sub: profile.id,
            id: profile.id,
            email: supabaseUser.email,
            subscription_tier_id: profile.subscription_tier_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
        };
    
        const token = jwt.sign(userPayload, config.jwt.SECRET, {
            expiresIn: config.jwt.EXPIRES_IN,
        });
    
        return { token, user: userPayload };
    }
}

export default new AuthService();