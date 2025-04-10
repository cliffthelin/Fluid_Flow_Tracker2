import type { ActionFunctionArgs } from "@remix-run/node";
    import { redirect } from "@remix-run/node";
    import { createSupabaseServerClient, handleSupabaseServerResponse } from "~/lib/supabase.server";
    import { getSession, destroySession } from "~/lib/session.server";

    export const action = async ({ request }: ActionFunctionArgs) => {
      const response = new Response();
      const supabase = createSupabaseServerClient(request);
      const session = await getSession(request.headers.get("Cookie"));

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase sign out error:", error);
          // Optionally handle the error, maybe redirect with an error message
        }
      } catch (error) {
         console.error("Error during sign out:", error);
         // Handle unexpected errors
      }


      // Destroy the Remix session and Supabase cookies
      response.headers.append("Set-Cookie", await destroySession(session));
      handleSupabaseServerResponse(supabase.headers, response); // This will add Set-Cookie headers to clear Supabase's cookies

      return redirect("/login", { headers: response.headers });
    };

     // You can have a loader to redirect if someone tries to GET this route
     export const loader = async () => redirect("/");
