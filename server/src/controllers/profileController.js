// src/controllers/profileController.js

import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";
import * as profileService from "../services/profileService.js";

export async function getCurrentUserProfile(req, res, next) {
	try {
		const userId = req.user.id;
		const profile = await profileService.getUserProfile(userId);
		res.status(200).json({
			success: true,
			data: profile,
		});
	} catch (error) {
		next(error);
	}
}

// --- FUNCIÓN COMPLETAMENTE CORREGIDA Y MEJORADA ---
export async function uploadAvatar(req, res, next) {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json({ success: false, message: "No se ha subido ningún archivo." });
		}

		const userId = req.user.id;
		const file = req.file;
		const bucketName = config.supabase.buckets.PUBLIC;

		const currentProfile = await profileService.getUserProfile(userId);
		const oldAvatarPath = currentProfile?.avatar_url;

		if (oldAvatarPath && oldAvatarPath !== "perfildefault.jpg") {
			try {
				const { error: removeError } = await supabase.storage
					.from(bucketName)
					.remove([oldAvatarPath]);

				if (removeError) {
					console.warn(
						`No se pudo borrar el avatar anterior: ${removeError.message}`,
					);
				}
			} catch (e) {
				console.warn(
					`Error al intentar borrar el avatar anterior: ${e.message}`,
				);
			}
		}

		const fileName = `users/${userId}/avatars/avatar-${Date.now()}`;
		const { error: uploadError } = await supabase.storage
			.from(bucketName)
			.upload(fileName, file.buffer, {
				contentType: file.mimetype,
				cacheControl: "3600",
				upsert: false,
			});

		if (uploadError) {
			throw new Error(`Error al subir el nuevo avatar: ${uploadError.message}`);
		}

		const updatedProfile = await profileService.updateAvatar(userId, fileName); // Usamos 'fileName'

		const { data: publicUrlData } = supabase.storage
			.from(bucketName)
			.getPublicUrl(fileName);

		res.status(200).json({
			success: true,
			message: "Avatar actualizado exitosamente.",
			data: {
				avatarUrl: publicUrlData.publicUrl,
			},
		});
	} catch (error) {
		next(error);
	}
}
export async function updateCurrentUserProfile(req, res, next) {
	try {
		const userId = req.user.id;
		const { firstName, lastName, birthDate } = req.body;

		const profileData = {
			first_name: firstName,
			last_name: lastName,
			birth_date: birthDate,
		};

		Object.keys(profileData).forEach(
			(key) => profileData[key] === undefined && delete profileData[key],
		);

		if (Object.keys(profileData).length === 0) {
			return res
				.status(400)
				.json({ success: false, message: "No hay datos para actualizar." });
		}

		const updatedProfile = await profileService.updateUserProfile(
			userId,
			profileData,
		);

		res.status(200).json({
			success: true,
			message: "Perfil actualizado exitosamente.",
			data: updatedProfile,
		});
	} catch (error) {
		next(error);
	}
}

export const handleUpdatePassword = async (req, res, next) => {
	try {
		const { newPassword } = req.body;
		const userId = req.user.id;

		await profileService.updateUserPassword(userId, newPassword);

		res
			.status(200)
			.json({ success: true, message: "Contraseña actualizada exitosamente." });
	} catch (error) {
		next(error);
	}
};
