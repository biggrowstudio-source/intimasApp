import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Faltan variables de entorno. Copia .env.example a .env y configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'intimas_app_auth',
    },
    realtime: {
      params: { eventsPerSecond: 5 },
    },
  },
)

export type SupabaseClient = typeof supabase
