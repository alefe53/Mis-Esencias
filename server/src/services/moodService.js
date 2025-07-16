// src/services/moodService.js
import moodRepository from "../repositories/moodRepository.js";

class MoodService {
	async getAllMoods() {
		return await moodRepository.getAll();
	}
}

export default new MoodService();
