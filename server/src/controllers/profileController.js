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
export async function uploadAvatar(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se ha subido ningún archivo." });
        }

        const userId = req.user.id;
        
        const updatedProfile = await profileService.updateAvatar(userId, {
            buffer: req.file.buffer,
            contentType: req.file.mimetype,
        });

        res.status(200).json({
            success: true,
            message: "Avatar actualizado exitosamente.",
            data: {
                avatarUrl: updatedProfile.avatar_url,
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
