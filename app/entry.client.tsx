/**
     * By default, Remix will handle hydrating your app on the client for you.
     * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
     * For more information, see https://remix.run/file-conventions/entry.client
     */

    import { RemixBrowser } from "@remix-run/react";
    import { startTransition, StrictMode } from "react";
    import { hydrateRoot } from "react-dom/client";

    // Add this function to safely parse window.ENV
    function getInitialEnv() {
      try {
        return window.ENV;
      } catch (e) {
        // If window.ENV is not available (e.g., during SSR or if script failed)
        console.error("window.ENV is not available on the client.");
        return {}; // Return an empty object or default values
      }
    }

    // Assign ENV to window for client-side Supabase access
    window.ENV = getInitialEnv();


    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      );
    });
