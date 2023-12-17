const extractId = (surrealId) => surrealId.split(":")[1] ?? surrealId;
/** @internal */
// Convert DB object to AdapterUser
export const docToUser = (doc) => ({
    ...doc,
    id: extractId(doc.id),
    emailVerified: doc.emailVerified ? new Date(doc.emailVerified) : null,
});
/** @internal */
// Convert DB object to AdapterAccount
export const docToAccount = (doc) => {
    const account = {
        ...doc,
        id: extractId(doc.id),
        userId: doc.userId ? extractId(doc.userId) : "",
    };
    return account;
};
/** @internal */
// Convert DB object to AdapterSession
export const docToSession = (doc) => ({
    userId: extractId(typeof doc.userId === "string" ? doc.userId : doc.userId.id),
    expires: new Date(doc.expires ?? ""),
    sessionToken: doc.sessionToken ?? "",
});
/** @internal */
// Convert AdapterUser to DB object
const userToDoc = (user) => {
    const doc = {
        ...user,
        emailVerified: user.emailVerified?.toISOString(),
    };
    return doc;
};
/** @internal */
// Convert AdapterAccount to DB object
const accountToDoc = (account) => {
    const doc = {
        ...account,
        userId: `user:${account.userId}`,
    };
    return doc;
};
/** @internal */
// Convert AdapterSession to DB object
export const sessionToDoc = (session) => {
    const doc = {
        ...session,
        expires: session.expires.toISOString(),
    };
    return doc;
};
/**
 * ## Setup
 *
 * The SurrealDB adapter does not handle connections automatically, so you will have to make sure that you pass the Adapter a `SurrealDBClient` that is connected already. Below you can see an example how to do this.
 *
 * ### Add the SurrealDB client
 *
 * #### Option 1/2 – Using RPC:
 *
 * ```js
 * import { Surreal } from "surrealdb.js";
 *
 * const connectionString = ... // i.e. "http://0.0.0.0:8000"
 * const user = ...
 * const pass = ...
 * const ns = ...
 * const db = ...
 *
 * const clientPromise = new Promise<Surreal>(async (resolve, reject) => {
 *   const db = new Surreal();
 *   try {
 *     await db.connect(`${connectionString}/rpc`, {
 *       ns, db, auth: { user, pass }
 *     })
 *     resolve(db)
 *   } catch (e) {
 *     reject(e)
 *   }
 * })
 *
 * // Export a module-scoped MongoClient promise. By doing this in a
 * // separate module, the client can be shared across functions.
 * export default clientPromise
 * ```
 *
 * #### Option 2/2 – Using HTTP:
 *
 * Usefull in serverlees environments like Vercel.
 *
 * ```js
 * import { ExperimentalSurrealHTTP } from "surrealdb.js"
 *
 * const connectionString = ... // i.e. "http://0.0.0.0:8000"
 * const user = ...
 * const pass = ...
 * const ns = ...
 * const db = ...
 *
 * const clientPromise = new Promise<ExperimentalSurrealHTTP<typeof fetch>>(async (resolve, reject) => {
 *   try {
 *     const db = new ExperimentalSurrealHTTP(connectionString, {
 *       fetch,
 *       ns, db, auth: { user, pass }
 *     })
 *     resolve(db)
 *   } catch (e) {
 *     reject(e)
 *   }
 * })
 *
 * // Export a module-scoped MongoClient promise. By doing this in a
 * // separate module, the client can be shared across functions.
 * export default clientPromise
 * ```
 *
 * ### Configure Auth.js
 *
 * ```js
 * import NextAuth from "next-auth"
 * import { SurrealDBAdapter } from "@auth/surrealdb-adapter"
 * import clientPromise from "../../../lib/surrealdb"
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/providers/oauth
 * export default NextAuth({
 *   adapter: SurrealDBAdapter(clientPromise),
 *   ...
 * })
 * ```
 **/
export function SurrealDBAdapter(client
// options = {}
) {
    return {
        async createUser(user) {
            const surreal = await client;
            const doc = userToDoc(user);
            const userDoc = await surreal.create("user", doc);
            if (userDoc.length) {
                return docToUser(userDoc[0]);
            }
            throw new Error("User not created");
        },
        async getUser(id) {
            const surreal = await client;
            try {
                const queryResult = await surreal.query("SELECT * FROM $user", {
                    user: `user:${id}`,
                });
                const doc = queryResult[0].result?.[0];
                if (doc) {
                    return docToUser(doc);
                }
            }
            catch (e) { }
            return null;
        },
        async getUserByEmail(email) {
            const surreal = await client;
            try {
                const users = await surreal.query(`SELECT * FROM user WHERE email = $email`, { email });
                const doc = users[0].result?.[0];
                if (doc)
                    return docToUser(doc);
            }
            catch (e) { }
            return null;
        },
        async getUserByAccount({ providerAccountId, provider, }) {
            const surreal = await client;
            try {
                const users = await surreal.query(`SELECT userId
           FROM account
           WHERE providerAccountId = $providerAccountId
           AND provider = $provider
           FETCH userId`, { providerAccountId, provider });
                const user = users[0].result?.[0]?.userId;
                if (user)
                    return docToUser(user);
            }
            catch (e) { }
            return null;
        },
        async updateUser(user) {
            const surreal = await client;
            const doc = {
                ...user,
                emailVerified: user.emailVerified?.toISOString(),
                id: undefined,
            };
            let updatedUser = await surreal.merge(`user:${user.id}`, doc);
            if (updatedUser.length) {
                return docToUser(updatedUser[0]);
            }
            else {
                throw new Error("User not updated");
            }
        },
        async deleteUser(userId) {
            const surreal = await client;
            // delete account
            try {
                const accounts = await surreal.query(`SELECT *
          FROM account
          WHERE userId = $userId
          LIMIT 1`, { userId: `user:${userId}` });
                const account = accounts[0].result?.[0];
                if (account) {
                    const accountId = extractId(account.id);
                    await surreal.delete(`account:${accountId}`);
                }
            }
            catch (e) { }
            // delete session
            try {
                const sessions = await surreal.query(`SELECT *
          FROM session
          WHERE userId = $userId
          LIMIT 1`, { userId: `user:${userId}` });
                const session = sessions[0].result?.[0];
                if (session) {
                    const sessionId = extractId(session.id);
                    await surreal.delete(`session:${sessionId}`);
                }
            }
            catch (e) { }
            // delete user
            await surreal.delete(`user:${userId}`);
            // TODO: put all 3 deletes inside a Promise all
        },
        async linkAccount(account) {
            const surreal = await client;
            const doc = await surreal.create("account", accountToDoc(account));
            return docToAccount(doc[0]);
        },
        async unlinkAccount({ providerAccountId, provider, }) {
            const surreal = await client;
            try {
                const accounts = await surreal.query(`SELECT *
          FROM account
          WHERE providerAccountId = $providerAccountId
            AND provider = $provider
          LIMIT 1`, { providerAccountId, provider });
                const account = accounts[0].result?.[0];
                if (account) {
                    const accountId = extractId(account.id);
                    await surreal.delete(`account:${accountId}`);
                }
            }
            catch (e) { }
        },
        async createSession({ sessionToken, userId, expires, }) {
            const surreal = await client;
            const doc = {
                sessionToken,
                userId: `user:${userId}`,
                expires,
            };
            const result = await surreal.create("session", doc);
            return result[0] ?? null;
        },
        async getSessionAndUser(sessionToken) {
            const surreal = await client;
            try {
                // Can't use limit 1 because it prevent userId to be fetched.
                //   Works setting limit to 2
                const sessions = await surreal.query(`SELECT *
           FROM session
           WHERE sessionToken = $sessionToken
           FETCH userId`, { sessionToken });
                const session = sessions[0].result?.[0];
                if (session) {
                    const userDoc = session.userId;
                    if (!userDoc)
                        return null;
                    return {
                        user: docToUser(userDoc),
                        session: docToSession({
                            ...session,
                            userId: userDoc.id,
                        }),
                    };
                }
            }
            catch (e) { }
            return null;
        },
        async updateSession(session) {
            const surreal = await client;
            try {
                const sessions = await surreal.query(`SELECT *
          FROM session
          WHERE sessionToken = $sessionToken
          LIMIT 1`, { sessionToken: session.sessionToken });
                const sessionDoc = sessions[0].result?.[0];
                if (sessionDoc && session.expires) {
                    const sessionId = extractId(sessionDoc.id);
                    let updatedSession = await surreal.merge(`session:${sessionId}`, sessionToDoc({
                        ...sessionDoc,
                        ...session,
                        userId: sessionDoc.userId,
                        expires: session.expires,
                    }));
                    if (updatedSession.length) {
                        return docToSession(updatedSession[0]);
                    }
                    else {
                        return null;
                    }
                }
            }
            catch (e) { }
            return null;
        },
        async deleteSession(sessionToken) {
            const surreal = await client;
            try {
                const sessions = await surreal.query(`SELECT *
           FROM session
           WHERE sessionToken = $sessionToken
           LIMIT 1`, { sessionToken });
                const session = sessions[0].result?.[0];
                if (session) {
                    const sessionId = extractId(session.id);
                    await surreal.delete(`session:${sessionId}`);
                    return;
                }
            }
            catch (e) { }
        },
        async createVerificationToken({ identifier, expires, token, }) {
            const surreal = await client;
            const doc = {
                identifier,
                expires,
                token,
            };
            const result = await surreal.create("verification_token", doc);
            return result[0] ?? null;
        },
        async useVerificationToken({ identifier, token, }) {
            const surreal = await client;
            try {
                const tokens = await surreal.query(`SELECT *
           FROM verification_token
           WHERE identifier = $identifier
             AND token = $verificationToken
           LIMIT 1`, { identifier, verificationToken: token });
                if (tokens.length && tokens[0].result) {
                    const vt = tokens[0].result[0];
                    if (vt) {
                        await surreal.delete(vt.id);
                        return {
                            identifier: vt.identifier,
                            expires: new Date(vt.expires),
                            token: vt.token,
                        };
                    }
                }
                else {
                    return null;
                }
            }
            catch (e) { }
            return null;
        },
    };
}
