// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const supabase = createClient(
	config.supabase.URL,
	config.supabase.SERVICE_KEY,
	{
		db: {
			schema: "api",
		},
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);

export { supabase };
