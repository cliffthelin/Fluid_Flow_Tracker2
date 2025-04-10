import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
    import { json, redirect } from "@remix-run/node";
    import { Form, useLoaderData } from "@remix-run/react";
    import { getSession } from "~/lib/session.server";
    import { createSupabaseServerClient } from "~/lib/supabase.server";

    export const meta: MetaFunction = () => {
      return [{ title: "Dashboard" }];
    };

    export const loader = async ({ request }: LoaderFunctionArgs) => {
      const session = await getSession(request.headers.get("Cookie"));
      const accessToken = session.get("access_token");

      if (!accessToken) {
        return redirect("/login");
      }

      const supabase = createSupabaseServerClient(request);
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
         console.error("Error getting user or no user found:", error);
         // Consider destroying the session if the token is invalid
         // return redirect("/logout"); // Redirecting to logout might be safer
         return redirect("/login");
      }


      // You can fetch user-specific data here using the user.id
      // const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      return json({ user });
    };

    export default function Dashboard() {
      const { user } = useLoaderData<typeof loader>();

      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </Form>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome, {user?.email}! You are logged in.
            </p>
            {/* Add dashboard content here */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Your User ID: {user?.id}</p>
              {/* Display more user info or dashboard widgets */}
            </div>
          </div>
        </div>
      );
    }
