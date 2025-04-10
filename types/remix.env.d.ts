/// <reference types="@remix-run/node" />
    /// <reference types="vite/client" />

    // Add this interface to declare the shape of window.ENV
    interface Window {
      ENV: {
        VITE_SUPABASE_URL: string;
        VITE_SUPABASE_ANON_KEY: string;
        // Add other env variables you pass to the client here
      };
    }
