// src/services/profileService.js

import * as profileRepository from "../repositories/profileRepository.js";

export async function getUserProfile(userId) {
	const profile = await profileRepository.getProfileById(userId);
	if (!profile) {
		throw new Error("Perfil no encontrado.");
	}
	return profile;
}

export async function updateUserProfile(userId, dataToUpdate) {
	const updatedProfile = await profileRepository.updateProfile(
		userId,
		dataToUpdate,
	);
	return updatedProfile;
}

export async function updateAvatar(userId, avatarUrl) {
	const updatedProfile = await profileRepository.updateAvatar(
		userId,
		avatarUrl,
	);
	return updatedProfile;
}

export const updateUserPassword = async (userId, newPassword) => {
	if (!newPassword || newPassword.length < 6) {
		const error = new Error("La contraseña debe tener al menos 6 caracteres.");
		error.statusCode = 400;
		throw error;
	}
	return profileRepository.updatePasswordInDB(userId, newPassword);
};
