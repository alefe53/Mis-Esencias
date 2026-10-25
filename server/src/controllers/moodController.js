// src/controllers/moodController.js
import moodService from "../services/moodService.js";

class MoodController {
	async getAllMoods(_req, res, next) {
		try {
			const moods = await moodService.getAllMoods();
			res.status(200).json({
				success: true,
				data: moods,
			});
		} catch (error) {
			next(error);
		}
	}
}

export default new MoodController();
