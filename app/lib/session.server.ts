import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET must be set");
    }

    // export the whole sessionStorage object
    export const sessionStorage = createCookieSessionStorage({
      cookie: {
        name: "_session", // use any name you want here
        sameSite: "lax", // protect against CSRF
        path: "/", // remember to add this so the cookie will work in all routes
        httpOnly: true, // prevent XSS attacks
        secrets: [process.env.SESSION_SECRET], // replace this with an actual secret
        secure: process.env.NODE_ENV === "production", // enable this in prod only
      },
    });

    // you can also export the methods individually for convenience
    export const { getSession, commitSession, destroySession } = sessionStorage;
