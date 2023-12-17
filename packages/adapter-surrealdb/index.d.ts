/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>Official <a href="https://www.surrealdb.com">SurrealDB</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://www.surrealdb.com">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/surrealdb.png" width="30" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/surrealdb-adapter surrealdb.js
 * ```
 *
 * @module @auth/surrealdb-adapter
 */
import Surreal, { ExperimentalSurrealHTTP } from "surrealdb.js";
import type { Adapter } from "@auth/core/adapters";
import type { ProviderType } from "@auth/core/providers";
type Document = Record<string, string | null | undefined> & {
    id: string;
};
export type UserDoc = Document & {
    email: string;
};
export type AccountDoc<T = string> = {
    id: string;
    userId: T;
    refresh_token?: string;
    access_token?: string;
    type: Extract<ProviderType, "oauth" | "oidc" | "email">;
    provider: string;
    providerAccountId: string;
    expires_at?: number;
};
export type SessionDoc<T = string> = Document & {
    userId: T;
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
export declare function SurrealDBAdapter<T>(client: Promise<Surreal | ExperimentalSurrealHTTP<T>>): Adapter;
export {};
//# sourceMappingURL=index.d.ts.map