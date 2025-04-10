import {
      Links,
      Meta,
      Outlet,
      Scripts,
      ScrollRestoration,
      useLoaderData,
      Form
    } from "@remix-run/react";
    import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
    import { json } from "@remix-run/node";
    import { getSession } from "~/lib/session.server";
    import { createSupabaseServerClient } from "./lib/supabase.server";


    import "./tailwind.css";

    export const links: LinksFunction = () => [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    ];

    export const loader = async ({ request }: LoaderFunctionArgs) => {
      const session = await getSession(request.headers.get("Cookie"));
      const accessToken = session.get("access_token");
      let user = null;

      // Pass env vars needed by client-side Supabase instance
      const env = {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
      };


      if (accessToken) {
        const supabase = createSupabaseServerClient(request);
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (!error && data.user) {
          user = data.user;
        } else if (error) {
           console.log("Root loader: Error getting user with access token:", error.message);
           // Potentially handle token refresh or logout here if needed,
           // but often letting protected routes handle redirect is fine.
        }
      }

      return json({ user, env });
    };


    export function Layout({ children }: { children: React.ReactNode }) {
       const { user, env } = useLoaderData<typeof loader>();

      return (
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <Meta />
            <Links />
          </head>
          <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
             <nav className="bg-gray-100 dark:bg-gray-800 p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">MyApp</a>
                <div>
                  {user ? (
                    <div className="flex items-center space-x-4">
                       <span className="text-sm text-gray-700 dark:text-gray-300">Welcome, {user.email}</span>
                       <a href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">Dashboard</a>
                      <Form method="post" action="/logout">
                        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-500 dark:hover:text-red-400">
                          Logout
                        </button>
                      </Form>
                    </div>
                  ) : (
                    <div className="space-x-4">
                      <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">Login</a>
                      <a href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">Sign Up</a>
                    </div>
                  )}
                </div>
              </div>
            </nav>
            {children}
            <ScrollRestoration />
             {/* Add window.ENV script */}
             <script
              dangerouslySetInnerHTML={{
                __html: `window.ENV = ${JSON.stringify(env)}`,
              }}
            />
            <Scripts />
          </body>
        </html>
      );
    }

    export default function App() {
      return <Outlet />;
    }

     // Add a CatchBoundary or ErrorBoundary if needed
     // export function ErrorBoundary() { ... }
