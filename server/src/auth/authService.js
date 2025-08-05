//src/auth/authService.js
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";

class AuthService {
	async register({ email, password, firstName, lastName }) {
		const tempAuthClient = createClient(
			config.supabase.URL,
			config.supabase.ANON_KEY,
		);

		const { data, error } = await tempAuthClient.auth.signUp({
			email,
			password,
			options: {
				data: {
					first_name: firstName,
					last_name: lastName,
				},
			},
		});

		if (error) {
			console.error(
				"Error durante el signUp con cliente temporal:",
				error.message,
			);
			if (error.message.includes("User already registered")) {
				throw new Error("Este email ya está registrado.");
			}
			throw new Error("No se pudo completar el registro.");
		}

		return data;
	}

	async login({ email, password }) {
		let authData;

		try {
			const tempAuthClient = createClient(
				config.supabase.URL,
				config.supabase.ANON_KEY,
			);
			const { data, error } = await tempAuthClient.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				throw error;
			}
			authData = data;
		} catch (error) {
			console.error(
				"Error de autenticación en el cliente temporal:",
				error.message,
			);
			throw new Error("Email o contraseña incorrectos.");
		}

		const { data: profile, error: profileError } = await supabase
			.rpc("get_user_profile_id", { p_user_id: authData.user.id })
			.single();

		if (profileError) {
			console.error(
				"Error al buscar el perfil con la función RPC:",
				profileError.message,
			);
			throw new Error("No se pudo recuperar el perfil del usuario.");
		}
		if (!profile) {
			throw new Error("No se encontró el perfil del usuario.");
		}

		const userPayload = {
			sub: profile.id,
			id: profile.id,
			email: authData.user.email,
			subscription_tier_id: profile.subscription_tier_id,
			first_name: profile.first_name,
			last_name: profile.last_name,
		};

		const token = jwt.sign(userPayload, config.jwt.SECRET, {
			expiresIn: config.jwt.EXPIRES_IN,
		});

		return { token, user: userPayload };
	}
}

export default new AuthService();
