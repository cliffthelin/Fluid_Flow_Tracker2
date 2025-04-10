import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
    import { json, redirect } from "@remix-run/node";
    import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
    import { createSupabaseServerClient, handleSupabaseServerResponse } from "~/lib/supabase.server";
    import { getSession, commitSession } from "~/lib/session.server";
    import { useState, useEffect } from "react";
    import { createSupabaseBrowserClient } from "~/lib/supabase.client";

    export const meta: MetaFunction = () => {
      return [{ title: "Login" }];
    };

    export const loader = async ({ request }: LoaderFunctionArgs) => {
      const session = await getSession(request.headers.get("Cookie"));
      if (session.has("access_token")) {
        // Redirect to the home page if the user is already logged in.
        return redirect("/dashboard");
      }
      const env = {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
      };
      return json({ env });
    };


    export async function action({ request }: ActionFunctionArgs) {
      const formData = await request.formData();
      const email = String(formData.get("email"));
      const password = String(formData.get("password"));
      const response = new Response();
      const supabase = createSupabaseServerClient(request);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

       if (error) {
        return json({ error: error.message }, { status: 400, headers: response.headers });
      }

      if (!data.session) {
         return json({ error: "Login failed. Please check your credentials." }, { status: 401, headers: response.headers });
      }

      // Store session
      const session = await getSession(request.headers.get("Cookie"));
      session.set("access_token", data.session.access_token);
      session.set("refresh_token", data.session.refresh_token);

      response.headers.append("Set-Cookie", await commitSession(session));
      handleSupabaseServerResponse(supabase.headers, response); // Attach Supabase SSR cookie headers

      return redirect("/dashboard", { headers: response.headers });
    }


    export default function Login() {
      const { env } = useLoaderData<typeof loader>();
      const actionData = useActionData<typeof action>();
      const navigation = useNavigation();
      const [supabase] = useState(() => createSupabaseBrowserClient());

      const isSubmitting = navigation.state === "submitting";

      // Handle OAuth callbacks if needed (optional)
      useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'SIGNED_IN') {
              // Potentially handle OAuth redirect sign-in here if needed
              // Usually handled by server-side loader/action though
            }
          }
        );
        return () => {
          authListener.subscription.unsubscribe();
        };
      }, [supabase]);


      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Login</h2>
            <Form method="post">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              {actionData?.error && (
                <p className="text-red-500 text-sm mb-4">{actionData.error}</p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Logging in..." : "Log in"}
                </button>
              </div>
            </Form>
             <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">
                Sign up
              </a>
            </p>
             {/* Add window.ENV script */}
             <script
              dangerouslySetInnerHTML={{
                __html: `window.ENV = ${JSON.stringify(env)}`,
              }}
            />
          </div>
        </div>
      );
    }
