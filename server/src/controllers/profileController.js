// src/controllers/profileController.js

import * as profileService from '../services/profileService.js';

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

export async function updateCurrentUserProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, birthDate } = req.body;

    const profileData = {
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
    };
    
    Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

    if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay datos para actualizar.' });
    }

    const updatedProfile = await profileService.updateUserProfile(userId, profileData);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}