import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
    import { json, redirect } from "@remix-run/node";
    import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
    import { createSupabaseServerClient, handleSupabaseServerResponse } from "~/lib/supabase.server";
    import { getSession, commitSession } from "~/lib/session.server";

    export const meta: MetaFunction = () => {
      return [{ title: "Sign Up" }];
    };

     export const loader = async ({ request }: LoaderFunctionArgs) => {
      const session = await getSession(request.headers.get("Cookie"));
      if (session.has("access_token")) {
        // Redirect to the home page if the user is already logged in.
        return redirect("/dashboard");
      }
       // Pass env vars to client if needed for client-side Supabase instance
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

      // IMPORTANT: Disable email confirmation for this example
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${new URL(request.url).origin}/dashboard`, // Or wherever you want them to land after signup
          // emailRedirectTo: `${new URL(request.url).origin}/confirm-email`, // Use this if you enable email confirmation
        },
      });

       if (error) {
        console.error("Supabase signup error:", error);
        return json({ error: error.message }, { status: 400, headers: response.headers });
      }

      // Handle cases where user exists but is unconfirmed, or other signup issues
      if (!data.session && data.user?.identities?.length === 0) {
         return json({ error: "Signup failed. The user might already exist or there was an issue." }, { status: 400, headers: response.headers });
      }
       if (!data.session) {
         // This might happen if email confirmation is required and not disabled
         // Or if there's another issue preventing session creation immediately
         console.log("Signup successful, but no session returned immediately (maybe email confirmation needed?). User:", data.user);
         // Redirect to a page telling them to check their email, or handle as appropriate
         // For this example (email confirmation disabled), we expect a session.
         // If you *enable* email confirmation, redirect to a confirmation pending page.
         return json({ message: "Signup successful! Please check your email to confirm." }, { headers: response.headers });
         // return redirect("/check-email"); // Example redirect
      }


      // User is signed up AND logged in immediately (since email confirmation is disabled)
      const session = await getSession(request.headers.get("Cookie"));
      session.set("access_token", data.session.access_token);
      session.set("refresh_token", data.session.refresh_token);

      response.headers.append("Set-Cookie", await commitSession(session));
      handleSupabaseServerResponse(supabase.headers, response); // Attach Supabase SSR cookie headers

      return redirect("/dashboard", { headers: response.headers });
    }


    export default function SignUp() {
      const actionData = useActionData<typeof action>();
      const navigation = useNavigation();
      const { env } = useLoaderData<typeof loader>(); // Get env vars

      const isSubmitting = navigation.state === "submitting";

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Create Account</h2>
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
                  autoComplete="new-password"
                  required
                  minLength={6} // Supabase default minimum
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="•••••••• (min. 6 characters)"
                />
              </div>

              {actionData?.error && (
                <p className="text-red-500 text-sm mb-4">{actionData.error}</p>
              )}
               {actionData?.message && (
                <p className="text-green-500 text-sm mb-4">{actionData.message}</p>
              )}


              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Account..." : "Sign Up"}
                </button>
              </div>
            </Form>
             <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">
                Log in
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
