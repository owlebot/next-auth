/**
 * _If you are looking to migrate from v4, visit the [Upgrade Guide (v5)](https://authjs.dev/guides/upgrade-to-v5)._
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install next-auth@beta
 * ```
 *
 * ## Environment variable inferrence
 *
 * `NEXTAUTH_URL` and `NEXTAUTH_SECRET` have been inferred since v4.
 *
 * Since NextAuth.js v5 can also automatically infer environment variables that are prefiexed with `AUTH_`.
 *
 * For example `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` will be used as the `clientId` and `clientSecret` options for the GitHub provider.
 *
 * :::tip
 * The environment variable name inferring has the following format for OAuth providers: `AUTH_{PROVIDER}_{ID|SECRET}`.
 *
 * `PROVIDER` is the uppercase snake case version of the provider's id, followed by either `ID` or `SECRET` respectively.
 * :::
 *
 * `AUTH_SECRET` and `AUTH_URL` are also aliased for `NEXTAUTH_SECRET` and `NEXTAUTH_URL` for consistency.
 *
 * To add social login to your app, the configuration becomes:
 *
 * ```ts title="auth.ts"
 * import NextAuth from "next-auth"
 * import GitHub from "next-auth/providers/github"
 * export const { handlers, auth } = NextAuth({ providers: [ GitHub ] })
 * ```
 *
 * And the `.env.local` file:
 *
 * ```sh title=".env.local"
 * AUTH_GITHUB_ID=...
 * AUTH_GITHUB_SECRET=...
 * AUTH_SECRET=...
 * ```
 *
 * :::tip
 * In production, `AUTH_SECRET` is a required environment variable - if not set, NextAuth.js will throw an error. See [MissingSecretError](https://authjs.dev/reference/core/errors#missingsecret) for more details.
 * :::
 *
 * If you need to override the default values for a provider, you can still call it as a function `GitHub({...})` as before.
 *
 * @module next-auth
 */
import { Auth } from "@auth/core";
import { reqWithEnvUrl, setEnvDefaults } from "./lib/env.js";
import { initAuth } from "./lib/index.js";
import { signIn, signOut, update } from "./lib/actions.js";
export { AuthError } from "@auth/core/errors";
/**
 *  Initialize NextAuth.js.
 *
 *  @example
 * ```ts title="auth.ts"
 * import NextAuth from "next-auth"
 * import GitHub from "@auth/core/providers/github"
 *
 * export const { handlers, auth } = NextAuth({ providers: [GitHub] })
 * ```
 */
export default function NextAuth(config) {
    setEnvDefaults(config);
    const httpHandler = (req) => Auth(reqWithEnvUrl(req), config);
    return {
        handlers: { GET: httpHandler, POST: httpHandler },
        // @ts-expect-error
        auth: initAuth(config),
        signIn: (provider, options, authorizationParams) => {
            return signIn(provider, options, authorizationParams, config);
        },
        signOut: (options) => {
            return signOut(options, config);
        },
        unstable_update: (data) => {
            return update(data, config);
        },
    };
}
