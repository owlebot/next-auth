/**
 * <div style={{backgroundColor: "#24292f", display: "flex", justifyContent: "space-between", color: "#fff", padding: 16}}>
 * <span>Built-in <b>GitHub</b> integration.</span>
 * <a href="https://github.com">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/providers/github.svg" height="48" width="48"/>
 * </a>
 * </div>
 *
 * @module providers/github
 */
/**
 * Add GitHub login to your page and make requests to [GitHub APIs](https://docs.github.com/en/rest).
 *
 * ### Setup
 *
 * #### Callback URL
 * ```
 * https://example.com/api/auth/callback/github
 * ```
 *
 * #### Configuration
 * ```ts
 * import { Auth } from "@auth/core"
 * import GitHub from "@auth/core/providers/github"
 *
 * const request = new Request(origin)
 * const response = await Auth(request, {
 *   providers: [GitHub({ clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET })],
 * })
 * ```
 *
 * ### Resources
 *
 * - [GitHub - Creating an OAuth App](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)
 * - [GitHub - Authorizing OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
 * - [GitHub - Configure your GitHub OAuth Apps](https://github.com/settings/developers)
 * - [Learn more about OAuth](https://authjs.dev/concepts/oauth)
 * - [Source code](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts)
 *
 * ### Notes
 *
 * By default, Auth.js assumes that the GitHub provider is
 * based on the [OAuth 2](https://www.rfc-editor.org/rfc/rfc6749.html) specification.
 *
 * :::tip
 *
 * The GitHub provider comes with a [default configuration](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts).
 * To override the defaults for your use case, check out [customizing a built-in OAuth provider](https://authjs.dev/guides/providers/custom-provider#override-default-options).
 *
 * :::
 *
 * :::info **Disclaimer**
 *
 * If you think you found a bug in the default configuration, you can [open an issue](https://authjs.dev/new/provider-issue).
 *
 * Auth.js strictly adheres to the specification and it cannot take responsibility for any deviation from
 * the spec by the provider. You can open an issue, but if the problem is non-compliance with the spec,
 * we might not pursue a resolution. You can ask for more help in [Discussions](https://authjs.dev/new/github-discussions).
 *
 * :::
 */
export default function GitHub(config) {
    return {
        id: "github",
        name: "GitHub",
        type: "oauth",
        authorization: {
            url: "https://github.com/login/oauth/authorize",
            params: { scope: "read:user user:email" },
        },
        token: "https://github.com/login/oauth/access_token",
        userinfo: {
            url: "https://api.github.com/user",
            async request({ tokens, provider }) {
                const profile = await fetch(provider.userinfo?.url, {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                        "User-Agent": "authjs",
                    },
                }).then(async (res) => await res.json());
                if (!profile.email) {
                    // If the user does not have a public email, get another via the GitHub API
                    // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
                    const res = await fetch("https://api.github.com/user/emails", {
                        headers: {
                            Authorization: `Bearer ${tokens.access_token}`,
                            "User-Agent": "authjs",
                        },
                    });
                    if (res.ok) {
                        const emails = await res.json();
                        profile.email = (emails.find((e) => e.primary) ?? emails[0]).email;
                    }
                }
                return profile;
            },
        },
        profile(profile) {
            return {
                id: profile.id.toString(),
                name: profile.name ?? profile.login,
                email: profile.email,
                image: profile.avatar_url,
            };
        },
        style: { logo: "/github.svg", bg: "#24292f", text: "#fff" },
        options: config,
    };
}
