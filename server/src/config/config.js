// src/config/config.js
import "dotenv/config";

export const config = {
	server: {
		PORT: process.env.PORT || 3001,
		HOST: process.env.HOST || "127.0.0.1",
	},
	supabase: {
		URL: process.env.SUPABASE_URL,
		ANON_KEY: process.env.SUPABASE_ANON_KEY,
		SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		buckets: {
			PUBLIC: "assets-publicos",
			PRIVATE: "assets-privados",
		},
	},
	jwt: {
		SECRET: process.env.JWT_SECRET || "secreto_inseguro_cambiar_en_produccion",
		EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
	},
	CORS_ORIGIN: process.env.CORS_ORIGIN,
	admin: {
		USER_ID: process.env.ADMIN_USER_ID,
	},
};

// Verificación crítica
if (!config.supabase.URL || !config.supabase.SERVICE_KEY) {
	console.error(
		"CRÍTICO: Las variables de Supabase no están definidas en .env",
	);
	process.exit(1); // Detiene la aplicación si faltan claves críticas
}

// Verificación de CORS
if (!config.CORS_ORIGIN) {
	console.error("CRÍTICO: La variable CORS_ORIGIN no está definida en .env");
	process.exit(1); // Es crucial para la comunicación con el frontend
}

// Advertencia de seguridad
if (config.jwt.SECRET === "secreto_inseguro_cambiar_en_produccion") {
	console.warn(
		"ADVERTENCIA: JWT_SECRET está usando un valor por defecto inseguro.",
	);
}
