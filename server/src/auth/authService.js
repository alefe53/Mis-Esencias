// src/auth/authService.js

import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";
import * as profileService from '../services/profileService.js';

class AuthService {
    async register({ email, password, firstName, lastName }) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    // Es crucial asignar nuestro avatar por defecto en el registro
                    avatar_url: 'perfildefault.jpg',
                },
            },
        });

        if (error) {
            if (error.message.includes("User already registered")) {
                throw new Error("Este email ya está registrado.");
            }
            console.error("Error en Supabase signUp:", error.message);
            throw new Error("No se pudo completar el registro.");
        }
        return data;
    }

    async login({ email, password }) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            throw new Error("Email o contraseña incorrectos.");
        }

        const { data: profile, error: profileError } = await supabase
            .rpc("get_user_profile_by_id", { p_user_id: authData.user.id })
            .single();

        if (profileError || !profile) {
            throw new Error("No se pudo recuperar el perfil del usuario.");
        }

        const userPayload = {
            sub: profile.id,
            id: profile.id,
            email: authData.user.email,
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

    async handleGoogleLogin(supabaseToken) {
        // 1. Obtenemos el usuario de Supabase. Esto nos da acceso a su ID y a los metadatos de Google.
        const { data: { user: supabaseUser }, error: userError } =
            await supabase.auth.getUser(supabaseToken);

        if (userError || !supabaseUser) {
            console.error("Error al verificar token de Supabase:", userError?.message);
            throw new Error("Token de Supabase inválido o expirado.");
        }

        // 2. [LÓGICA CENTRAL] Obtenemos el perfil *ACTUAL* directamente de nuestra tabla `profiles`.
        const { data: currentProfile, error: profileError } = await supabase
            .rpc("get_user_profile_by_id", { p_user_id: supabaseUser.id })
            .single();

        if (profileError || !currentProfile) {
            // Esto no debería pasar si el trigger `handle_new_user` funciona, pero es una buena salvaguarda.
            throw new Error("No se pudo encontrar el perfil del usuario en la base de datos.");
        }

        // 3. [LA DECISIÓN] Comprobamos si el usuario tiene un avatar personalizado.
        // Un avatar personalizado es cualquier cosa que NO sea nuestro avatar por defecto.
        const hasCustomAvatar = currentProfile.avatar_url !== 'perfildefault.jpg';

        if (hasCustomAvatar) {
            // Si ya tiene un avatar personalizado, no hacemos NADA.
            console.log(`El usuario ${supabaseUser.id} ya tiene un avatar personalizado. Se mantendrá.`);
        } else {
            // Si tiene el avatar por defecto, intentamos "mejorarlo" con el de Google.
            console.log(`El usuario ${supabaseUser.id} tiene el avatar por defecto. Intentando actualizar desde Google.`);
            await profileService.updateAvatar(supabaseUser.id, {
                url: supabaseUser.user_metadata.avatar_url,
            });
        }

        // 4. Para asegurar consistencia, volvemos a pedir el perfil final.
        // Este contendrá el avatar de Google (si se actualizó) o el personalizado que ya tenía.
        const { data: finalProfile, error: finalProfileError } = await supabase
            .rpc("get_user_profile_by_id", { p_user_id: supabaseUser.id })
            .single();

        if (finalProfileError || !finalProfile) {
            throw new Error("No se pudo recuperar el perfil final del usuario para generar el token.");
        }

        // 5. Creamos nuestro JWT con la información definitiva y correcta.
        const userPayload = {
            sub: finalProfile.id,
            id: finalProfile.id,
            email: supabaseUser.email,
            subscription_tier_id: finalProfile.subscription_tier_id,
            first_name: finalProfile.first_name,
            last_name: finalProfile.last_name,
            avatar_url: finalProfile.avatar_url, // <-- Aquí irá la URL correcta siempre.
        };

        const token = jwt.sign(userPayload, config.jwt.SECRET, {
            expiresIn: config.jwt.EXPIRES_IN,
        });

        return { token, user: userPayload };
    }
}

export default new AuthService();