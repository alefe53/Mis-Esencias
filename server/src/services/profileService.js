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
    const updatedProfile = await profileRepository.updateProfile(userId, dataToUpdate);
    return updatedProfile;
}

export async function updateAvatar(userId, avatarUrl) {
  const updatedProfile = await profileRepository.updateAvatar(userId, avatarUrl);
  return updatedProfile;
}
