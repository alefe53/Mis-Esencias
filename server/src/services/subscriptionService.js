// src/services/subscriptionService.js
import { getAllTiersFromDB } from "../repositories/subscriptionRepository.js";

export const getSubscriptionTiers = async () => {
	try {
		const tiers = await getAllTiersFromDB();
		return tiers;
	} catch (error) {
		throw error;
	}
};
