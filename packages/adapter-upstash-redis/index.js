export const defaultOptions = {
    baseKeyPrefix: "",
    accountKeyPrefix: "user:account:",
    accountByUserIdPrefix: "user:account:by-user-id:",
    emailKeyPrefix: "user:email:",
    sessionKeyPrefix: "user:session:",
    sessionByUserIdKeyPrefix: "user:session:by-user-id:",
    userKeyPrefix: "user:",
    verificationTokenKeyPrefix: "user:token:",
};
const isoDateRE = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
function isDate(value) {
    return value && isoDateRE.test(value) && !isNaN(Date.parse(value));
}
export function hydrateDates(json) {
    return Object.entries(json).reduce((acc, [key, val]) => {
        acc[key] = isDate(val) ? new Date(val) : val;
        return acc;
    }, {});
}
/**
 * ## Setup
 *
 * Configure Auth.js to use the Upstash Redis Adapter:
 *
 * ```javascript title="pages/api/auth/[...nextauth].js"
 * import NextAuth from "next-auth"
 * import GoogleProvider from "next-auth/providers/google"
 * import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter"
 * import upstashRedisClient from "@upstash/redis"
 *
 * const redis = upstashRedisClient(
 *   process.env.UPSTASH_REDIS_URL,
 *   process.env.UPSTASH_REDIS_TOKEN
 * )
 *
 * export default NextAuth({
 *   adapter: UpstashRedisAdapter(redis),
 *   providers: [
 *     GoogleProvider({
 *       clientId: process.env.GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *     }),
 *   ],
 * })
 * ```
 *
 * ## Advanced usage
 *
 * ### Using multiple apps with a single Upstash Redis instance
 *
 * The Upstash free-tier allows for only one Redis instance. If you have multiple Auth.js connected apps using this instance, you need different key prefixes for every app.
 *
 * You can change the prefixes by passing an `options` object as the second argument to the adapter factory function.
 *
 * The default values for this object are:
 *
 * ```js
 * const defaultOptions = {
 *   baseKeyPrefix: "",
 *   accountKeyPrefix: "user:account:",
 *   accountByUserIdPrefix: "user:account:by-user-id:",
 *   emailKeyPrefix: "user:email:",
 *   sessionKeyPrefix: "user:session:",
 *   sessionByUserIdKeyPrefix: "user:session:by-user-id:",
 *   userKeyPrefix: "user:",
 *   verificationTokenKeyPrefix: "user:token:",
 * }
 * ```
 *
 * Usually changing the `baseKeyPrefix` should be enough for this scenario, but for more custom setups, you can also change the prefixes of every single key.
 *
 * Example:
 *
 * ```js
 * export default NextAuth({
 *   ...
 *   adapter: UpstashRedisAdapter(redis, {baseKeyPrefix: "app2:"})
 *   ...
 * })
 * ```
 */
export function UpstashRedisAdapter(client, options = {}) {
    const mergedOptions = {
        ...defaultOptions,
        ...options,
    };
    const { baseKeyPrefix } = mergedOptions;
    const accountKeyPrefix = baseKeyPrefix + mergedOptions.accountKeyPrefix;
    const accountByUserIdPrefix = baseKeyPrefix + mergedOptions.accountByUserIdPrefix;
    const emailKeyPrefix = baseKeyPrefix + mergedOptions.emailKeyPrefix;
    const sessionKeyPrefix = baseKeyPrefix + mergedOptions.sessionKeyPrefix;
    const sessionByUserIdKeyPrefix = baseKeyPrefix + mergedOptions.sessionByUserIdKeyPrefix;
    const userKeyPrefix = baseKeyPrefix + mergedOptions.userKeyPrefix;
    const verificationTokenKeyPrefix = baseKeyPrefix + mergedOptions.verificationTokenKeyPrefix;
    const setObjectAsJson = async (key, obj) => await client.set(key, JSON.stringify(obj));
    const setAccount = async (id, account) => {
        const accountKey = accountKeyPrefix + id;
        await setObjectAsJson(accountKey, account);
        await client.set(accountByUserIdPrefix + account.userId, accountKey);
        return account;
    };
    const getAccount = async (id) => {
        const account = await client.get(accountKeyPrefix + id);
        if (!account)
            return null;
        return hydrateDates(account);
    };
    const setSession = async (id, session) => {
        const sessionKey = sessionKeyPrefix + id;
        await setObjectAsJson(sessionKey, session);
        await client.set(sessionByUserIdKeyPrefix + session.userId, sessionKey);
        return session;
    };
    const getSession = async (id) => {
        const session = await client.get(sessionKeyPrefix + id);
        if (!session)
            return null;
        return hydrateDates(session);
    };
    const setUser = async (id, user) => {
        await setObjectAsJson(userKeyPrefix + id, user);
        await client.set(`${emailKeyPrefix}${user.email}`, id);
        return user;
    };
    const getUser = async (id) => {
        const user = await client.get(userKeyPrefix + id);
        if (!user)
            return null;
        return hydrateDates(user);
    };
    return {
        async createUser(user) {
            const id = crypto.randomUUID();
            // TypeScript thinks the emailVerified field is missing
            // but all fields are copied directly from user, so it's there
            return await setUser(id, { ...user, id });
        },
        getUser,
        async getUserByEmail(email) {
            const userId = await client.get(emailKeyPrefix + email);
            if (!userId) {
                return null;
            }
            return await getUser(userId);
        },
        async getUserByAccount(account) {
            const dbAccount = await getAccount(`${account.provider}:${account.providerAccountId}`);
            if (!dbAccount)
                return null;
            return await getUser(dbAccount.userId);
        },
        async updateUser(updates) {
            const userId = updates.id;
            const user = await getUser(userId);
            return await setUser(userId, { ...user, ...updates });
        },
        async linkAccount(account) {
            const id = `${account.provider}:${account.providerAccountId}`;
            return await setAccount(id, { ...account, id });
        },
        createSession: (session) => setSession(session.sessionToken, session),
        async getSessionAndUser(sessionToken) {
            const session = await getSession(sessionToken);
            if (!session)
                return null;
            const user = await getUser(session.userId);
            if (!user)
                return null;
            return { session, user };
        },
        async updateSession(updates) {
            const session = await getSession(updates.sessionToken);
            if (!session)
                return null;
            return await setSession(updates.sessionToken, { ...session, ...updates });
        },
        async deleteSession(sessionToken) {
            await client.del(sessionKeyPrefix + sessionToken);
        },
        async createVerificationToken(verificationToken) {
            await setObjectAsJson(verificationTokenKeyPrefix +
                verificationToken.identifier +
                ":" +
                verificationToken.token, verificationToken);
            return verificationToken;
        },
        async useVerificationToken(verificationToken) {
            const tokenKey = verificationTokenKeyPrefix +
                verificationToken.identifier +
                ":" +
                verificationToken.token;
            const token = await client.get(tokenKey);
            if (!token)
                return null;
            await client.del(tokenKey);
            return hydrateDates(token);
            // return reviveFromJson(token)
        },
        async unlinkAccount(account) {
            const id = `${account.provider}:${account.providerAccountId}`;
            const dbAccount = await getAccount(id);
            if (!dbAccount)
                return;
            const accountKey = `${accountKeyPrefix}${id}`;
            await client.del(accountKey, `${accountByUserIdPrefix} + ${dbAccount.userId}`);
        },
        async deleteUser(userId) {
            const user = await getUser(userId);
            if (!user)
                return;
            const accountByUserKey = accountByUserIdPrefix + userId;
            const accountKey = await client.get(accountByUserKey);
            const sessionByUserIdKey = sessionByUserIdKeyPrefix + userId;
            const sessionKey = await client.get(sessionByUserIdKey);
            await client.del(userKeyPrefix + userId, `${emailKeyPrefix}${user.email}`, accountKey, accountByUserKey, sessionKey, sessionByUserIdKey);
        },
    };
}
