// RUTA: src/services/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL o Anon Key no están definidas en las variables de entorno (.env)");
}

// Cliente de Supabase para el frontend (usa la ANON KEY)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)