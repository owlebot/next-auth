/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>Official <a href="https://www.mongodb.com">MongoDB</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://www.mongodb.com">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/mongodb.svg" width="30" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/mongodb-adapter mongodb
 * ```
 *
 * @module @auth/mongodb-adapter
 */
import { ObjectId } from "mongodb";
export const defaultCollections = {
    Users: "users",
    Accounts: "accounts",
    Sessions: "sessions",
    VerificationTokens: "verification_tokens",
};
export const format = {
    /** Takes a mongoDB object and returns a plain old JavaScript object */
    from(object) {
        const newObject = {};
        for (const key in object) {
            const value = object[key];
            if (key === "_id") {
                newObject.id = value.toHexString();
            }
            else if (key === "userId") {
                newObject[key] = value.toHexString();
            }
            else {
                newObject[key] = value;
            }
        }
        return newObject;
    },
    /** Takes a plain old JavaScript object and turns it into a mongoDB object */
    to(object) {
        const newObject = {
            _id: _id(object.id),
        };
        for (const key in object) {
            const value = object[key];
            if (key === "userId")
                newObject[key] = _id(value);
            else if (key === "id")
                continue;
            else
                newObject[key] = value;
        }
        return newObject;
    },
};
/** @internal */
export function _id(hex) {
    if (hex?.length !== 24)
        return new ObjectId();
    return new ObjectId(hex);
}
/**
 * ## Setup
 *
 * The MongoDB adapter does not handle connections automatically, so you will have to make sure that you pass the Adapter a `MongoClient` that is connected already. Below you can see an example how to do this.
 *
 * ### Add the MongoDB client
 *
 * ```ts
 * // This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
 * import { MongoClient } from "mongodb"
 *
 * if (!process.env.MONGODB_URI) {
 *   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
 * }
 *
 * const uri = process.env.MONGODB_URI
 * const options = {}
 *
 * let client
 * let clientPromise: Promise<MongoClient>
 *
 * if (process.env.NODE_ENV === "development") {
 *   // In development mode, use a global variable so that the value
 *   // is preserved across module reloads caused by HMR (Hot Module Replacement).
 *   if (!global._mongoClientPromise) {
 *     client = new MongoClient(uri, options)
 *     global._mongoClientPromise = client.connect()
 *   }
 *   clientPromise = global._mongoClientPromise
 * } else {
 *   // In production mode, it's best to not use a global variable.
 *   client = new MongoClient(uri, options)
 *   clientPromise = client.connect()
 * }
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
 * import { MongoDBAdapter } from "@auth/mongodb-adapter"
 * import clientPromise from "../../../lib/mongodb"
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/providers/oauth
 * export default NextAuth({
 *   adapter: MongoDBAdapter(clientPromise),
 *   ...
 * })
 * ```
 **/
export function MongoDBAdapter(client, options = {}) {
    const { collections } = options;
    const { from, to } = format;
    const db = (async () => {
        const _db = (await client).db(options.databaseName);
        const c = { ...defaultCollections, ...collections };
        return {
            U: _db.collection(c.Users),
            A: _db.collection(c.Accounts),
            S: _db.collection(c.Sessions),
            V: _db.collection(c?.VerificationTokens),
        };
    })();
    return {
        async createUser(data) {
            const user = to(data);
            await (await db).U.insertOne(user);
            return from(user);
        },
        async getUser(id) {
            const user = await (await db).U.findOne({ _id: _id(id) });
            if (!user)
                return null;
            return from(user);
        },
        async getUserByEmail(email) {
            const user = await (await db).U.findOne({ email });
            if (!user)
                return null;
            return from(user);
        },
        async getUserByAccount(provider_providerAccountId) {
            const account = await (await db).A.findOne(provider_providerAccountId);
            if (!account)
                return null;
            const user = await (await db).U.findOne({ _id: new ObjectId(account.userId) });
            if (!user)
                return null;
            return from(user);
        },
        async updateUser(data) {
            const { _id, ...user } = to(data);
            const result = await (await db).U.findOneAndUpdate({ _id }, { $set: user }, { returnDocument: "after" });
            return from(result);
        },
        async deleteUser(id) {
            const userId = _id(id);
            const m = await db;
            await Promise.all([
                m.A.deleteMany({ userId: userId }),
                m.S.deleteMany({ userId: userId }),
                m.U.deleteOne({ _id: userId }),
            ]);
        },
        linkAccount: async (data) => {
            const account = to(data);
            await (await db).A.insertOne(account);
            return account;
        },
        async unlinkAccount(provider_providerAccountId) {
            const account = await (await db).A.findOneAndDelete(provider_providerAccountId);
            return from(account);
        },
        async getSessionAndUser(sessionToken) {
            const session = await (await db).S.findOne({ sessionToken });
            if (!session)
                return null;
            const user = await (await db).U.findOne({ _id: new ObjectId(session.userId) });
            if (!user)
                return null;
            return {
                user: from(user),
                session: from(session),
            };
        },
        async createSession(data) {
            const session = to(data);
            await (await db).S.insertOne(session);
            return from(session);
        },
        async updateSession(data) {
            const { _id, ...session } = to(data);
            const updatedSession = await (await db).S.findOneAndUpdate({ sessionToken: session.sessionToken }, { $set: session }, { returnDocument: "after" });
            return from(updatedSession);
        },
        async deleteSession(sessionToken) {
            const session = await (await db).S.findOneAndDelete({
                sessionToken,
            });
            return from(session);
        },
        async createVerificationToken(data) {
            await (await db).V.insertOne(to(data));
            return data;
        },
        async useVerificationToken(identifier_token) {
            const verificationToken = await (await db).V.findOneAndDelete(identifier_token);
            if (!verificationToken)
                return null;
            const { _id, ...rest } = verificationToken;
            return rest;
        },
    };
}
