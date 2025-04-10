import { createBrowserClient } from '@supabase/ssr'
    import type { Database } from './database.types' // Assuming you might generate types later

    export const createSupabaseBrowserClient = () =>
      createBrowserClient<Database>(
        window.ENV.VITE_SUPABASE_URL!,
        window.ENV.VITE_SUPABASE_ANON_KEY!
      )
