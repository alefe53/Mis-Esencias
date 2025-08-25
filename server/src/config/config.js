// src/config/config.js
export const config = {
	server: {
		PORT: process.env.PORT || 3001,
		HOST: process.env.HOST || "0.0.0.0",
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
	livekit: {
        URL: process.env.LIVEKIT_URL,
        API_KEY: process.env.LIVEKIT_API_KEY,
        API_SECRET: process.env.LIVEKIT_API_SECRET,
    },
	mercadoPago: {
        ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
        PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
        WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
    },
    paypal: {
        CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
        CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
        WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
        MODE: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    }
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
if (!config.livekit.API_KEY || !config.livekit.API_SECRET) {
    console.error("CRÍTICO: Las variables de LiveKit no están definidas en .env");
    process.exit(1);
}
