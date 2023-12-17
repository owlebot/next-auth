import { Auth } from "@auth/core";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { detectOrigin, reqWithEnvUrl } from "./env.js";
/** Server-side method to read the session. */
async function getSession(headers, config) {
    const origin = detectOrigin(headers);
    const request = new Request(`${origin}/session`, {
        headers: { cookie: headers.get("cookie") ?? "" },
    });
    return Auth(request, {
        ...config,
        callbacks: {
            ...config.callbacks,
            // Since we are server-side, we don't need to filter out the session data
            // See https://authjs.dev/guides/upgrade-to-v5/v5#authenticating-server-side
            // TODO: Taint the session data to prevent accidental leakage to the client
            // https://react.devreference/nextjs/react/experimental_taintObjectReference
            async session(...args) {
                const session = 
                // If the user defined a custom session callback, use that instead
                (await config.callbacks?.session?.(...args)) ?? args[0].session;
                // @ts-expect-error either user or token will be defined
                const user = args[0].user ?? args[0].token;
                return { user, ...session };
            },
        },
    });
}
function isReqWrapper(arg) {
    return typeof arg === "function";
}
export function initAuth(config) {
    return (...args) => {
        if (!args.length) {
            // React Server Components
            return getSession(headers(), config).then((r) => r.json());
        }
        if (args[0] instanceof Request) {
            // middleare.ts
            // export { auth as default } from "auth"
            const req = args[0];
            const ev = args[1];
            return handleAuth([req, ev], config);
        }
        if (isReqWrapper(args[0])) {
            // middleware.ts/router.ts
            // import { auth } from "auth"
            // export default auth((req) => { console.log(req.auth) }})
            const userMiddlewareOrRoute = args[0];
            return async (...args) => {
                return handleAuth(args, config, userMiddlewareOrRoute);
            };
        }
        // API Routes, getServerSideProps
        const request = "req" in args[0] ? args[0].req : args[0];
        const response = "res" in args[0] ? args[0].res : args[1];
        return getSession(
        // @ts-expect-error
        new Headers(request.headers), config).then(async (authResponse) => {
            const auth = await authResponse.json();
            for (const cookie of authResponse.headers.getSetCookie())
                response.headers.append("set-cookie", cookie);
            return auth;
        });
    };
}
async function handleAuth(args, config, userMiddlewareOrRoute) {
    const request = reqWithEnvUrl(args[0]);
    const sessionResponse = await getSession(request.headers, config);
    const auth = await sessionResponse.json();
    let authorized = true;
    if (config.callbacks?.authorized) {
        authorized = await config.callbacks.authorized({ request, auth });
    }
    let response = NextResponse.next?.();
    if (authorized instanceof Response) {
        // User returned a custom response, like redirecting to a page or 401, respect it
        response = authorized;
        const redirect = authorized.headers.get("Location");
        const { pathname } = request.nextUrl;
        // If the user is redirecting to the same NextAuth.js action path as the current request,
        // don't allow the redirect to prevent an infinite loop
        if (redirect &&
            isSameAuthAction(pathname, new URL(redirect).pathname, config)) {
            authorized = true;
        }
    }
    else if (userMiddlewareOrRoute) {
        // Execute user's middleware/handler with the augmented request
        const augmentedReq = request;
        augmentedReq.auth = auth;
        response =
            // @ts-expect-error
            (await userMiddlewareOrRoute(augmentedReq, args[1])) ??
                NextResponse.next();
    }
    else if (!authorized) {
        const signInPage = config.pages?.signIn ?? "/api/auth/signin";
        if (request.nextUrl.pathname !== signInPage) {
            // Redirect to signin page by default if not authorized
            const signInUrl = request.nextUrl.clone();
            signInUrl.pathname = signInPage;
            signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
            response = NextResponse.redirect(signInUrl);
        }
    }
    const finalResponse = new Response(response?.body, response);
    // Preserve cookies from the session response
    for (const cookie of sessionResponse.headers.getSetCookie())
        finalResponse.headers.append("set-cookie", cookie);
    return finalResponse;
}
function isSameAuthAction(requestPath, redirectPath, config) {
    const action = redirectPath.replace(`${requestPath}/`, "");
    const pages = Object.values(config.pages ?? {});
    return ((actions.has(action) || pages.includes(redirectPath)) &&
        redirectPath === requestPath);
}
const actions = new Set([
    "providers",
    "session",
    "csrf",
    "signin",
    "signout",
    "callback",
    "verify-request",
    "error",
]);
