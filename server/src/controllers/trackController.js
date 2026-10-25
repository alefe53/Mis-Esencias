// RUTA: src/controllers/trackController.js

import { trackService } from "../services/trackService.js";
import { createPrivateUrl, getPublicUrl } from "../utils/supabaseUtils.js";

const PUBLIC_BUCKET = "assets-publicos";
const PRIVATE_BUCKET = "assets-privados";
const FREE_TIER_ID = 1;

const getPlayableUrl = async (req, res, next) => {
	try {
		const { filePath, requiredTierId } = req.body;
		const userTierId = req.user?.subscription_tier_id || FREE_TIER_ID;

		if (!filePath) {
			return res
				.status(400)
				.json({ success: false, message: "filePath es requerido." });
		}

		const effectiveRequiredTier = requiredTierId || FREE_TIER_ID;
		if (effectiveRequiredTier > userTierId) {
			return res
				.status(403)
				.json({ success: false, message: "Suscripción insuficiente." });
		}

		let url;

		if (effectiveRequiredTier > FREE_TIER_ID) {
			console.log(`Generando URL privada para: ${filePath}`);
			url = await createPrivateUrl(PRIVATE_BUCKET, filePath);
		} else {
			console.log(`Generando URL pública para: ${filePath}`);
			url = getPublicUrl(PUBLIC_BUCKET, filePath);
		}

		if (!url) {
			return res.status(404).json({
				success: false,
				message:
					"No se pudo generar la URL para el archivo. Puede que no exista en el bucket correspondiente.",
			});
		}

		res.status(200).json({ success: true, playableUrl: url });
	} catch (error) {
		next(error);
	}
};

const getMusicCatalog = async (req, res, next) => {
	try {
		const userTierId = req.user?.subscription_tier_id || 1;

		const catalog = await trackService.fetchMusicCatalog(userTierId);

		res.status(200).json({ success: true, data: catalog });
	} catch (error) {
		next(error);
	}
};

export const trackController = { getPlayableUrl, getMusicCatalog };
