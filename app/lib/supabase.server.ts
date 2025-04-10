import { createServerClient, parse, serialize } from '@supabase/ssr'
    import type { SupabaseClient } from '@supabase/supabase-js'
    import type { Database } from './database.types' // Assuming you might generate types later

    export const createSupabaseServerClient = (request: Request): SupabaseClient<Database> => {
      const cookies = parse(request.headers.get('Cookie') ?? '')
      const headers = new Headers()

      const supabase = createServerClient<Database>(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(key) {
              return cookies[key]
            },
            set(key, value, options) {
              headers.append('Set-Cookie', serialize(key, value, options))
            },
            remove(key, options) {
              headers.append('Set-Cookie', serialize(key, '', options))
            },
          },
        }
      )

      return supabase
    }

    // Utility to handle setting cookie headers, needed for server-side actions/loaders
    export const handleSupabaseServerResponse = (headers: Headers, response: Response): Response => {
      headers.forEach((value, key) => {
        response.headers.append(key, value)
      })
      return response
    }
