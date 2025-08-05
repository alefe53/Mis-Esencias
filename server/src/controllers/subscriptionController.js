// src/controllers/subscriptionController.js
import * as subscriptionService from "../services/subscriptionService.js";

export const getAllTiers = async (_req, res, next) => {
	try {
		const tiers = await subscriptionService.getSubscriptionTiers();
		res.status(200).json({
			success: true,
			data: tiers,
		});
	} catch (error) {
		next(error);
	}
};
