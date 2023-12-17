/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>An official <a href="https://developers.cloudflare.com/d1/">Cloudflare D1</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://developers.cloudflare.com/d1/">
 *   <img style={{display: "block"}} src="/img/adapters/d1.svg" width="48" />
 *  </a>
 * </div>
 *
 * ## Warning
 * This adapter is not developed or maintained by Cloudflare and they haven't declared the D1 api stable.  The author will make an effort to keep this adapter up to date.
 * The adapter is compatible with the D1 api as of March 22, 2023.
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install next-auth @auth/d1-adapter
 * ```
 *
 * @module @auth/d1-adapter
 */
import type { D1Database as WorkerDatabase } from "@cloudflare/workers-types";
import type { D1Database as MiniflareD1Database } from "@miniflare/d1";
import type { Adapter } from "@auth/core/adapters";
export { up } from "./migrations";
/**
 * @type @cloudflare/workers-types.D1Database | @miniflare/d1.D1Database
 */
export type D1Database = WorkerDatabase | MiniflareD1Database;
export declare const CREATE_USER_SQL = "INSERT INTO users (id, name, email, emailVerified, image) VALUES (?, ?, ?, ?, ?)";
export declare const GET_USER_BY_ID_SQL = "SELECT * FROM users WHERE id = ?";
export declare const GET_USER_BY_EMAIL_SQL = "SELECT * FROM users WHERE email = ?";
export declare const GET_USER_BY_ACCOUNTL_SQL = "\n  SELECT u.*\n  FROM users u JOIN accounts a ON a.userId = u.id\n  WHERE a.providerAccountId = ? AND a.provider = ?";
export declare const UPDATE_USER_BY_ID_SQL = "\n  UPDATE users \n  SET name = ?, email = ?, emailVerified = ?, image = ?\n  WHERE id = ? ";
export declare const DELETE_USER_SQL = "DELETE FROM users WHERE id = ?";
export declare const CREATE_SESSION_SQL = "INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?,?,?,?)";
export declare const GET_SESSION_BY_TOKEN_SQL = "\n  SELECT id, sessionToken, userId, expires\n  FROM sessions\n  WHERE sessionToken = ?";
export declare const UPDATE_SESSION_BY_SESSION_TOKEN_SQL = "UPDATE sessions SET expires = ? WHERE sessionToken = ?";
export declare const DELETE_SESSION_SQL = "DELETE FROM sessions WHERE sessionToken = ?";
export declare const DELETE_SESSION_BY_USER_ID_SQL = "DELETE FROM sessions WHERE userId = ?";
export declare const CREATE_ACCOUNT_SQL = "\n  INSERT INTO accounts (\n    id, userId, type, provider, \n    providerAccountId, refresh_token, access_token, \n    expires_at, token_type, scope, id_token, session_state,\n    oauth_token, oauth_token_secret\n  ) \n  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
export declare const GET_ACCOUNT_BY_ID_SQL = "SELECT * FROM accounts WHERE id = ? ";
export declare const GET_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL = "SELECT * FROM accounts WHERE provider = ? AND providerAccountId = ?";
export declare const DELETE_ACCOUNT_BY_PROVIDER_AND_PROVIDER_ACCOUNT_ID_SQL = "DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?";
export declare const DELETE_ACCOUNT_BY_USER_ID_SQL = "DELETE FROM accounts WHERE userId = ?";
export declare const GET_VERIFICATION_TOKEN_BY_IDENTIFIER_AND_TOKEN_SQL = "SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?";
export declare const CREATE_VERIFICATION_TOKEN_SQL = "INSERT INTO verification_tokens (identifier, expires, token) VALUES (?,?,?)";
export declare const DELETE_VERIFICATION_TOKEN_SQL = "DELETE FROM verification_tokens WHERE identifier = ? and token = ?";
export declare function createRecord<RecordType>(db: D1Database, CREATE_SQL: string, bindings: any[], GET_SQL: string, getBindings: any[]): Promise<RecordType | null>;
export declare function getRecord<RecordType>(db: D1Database, SQL: string, bindings: any[]): Promise<RecordType | null>;
export declare function updateRecord(db: D1Database, SQL: string, bindings: any[]): Promise<import("@miniflare/d1").D1Result<unknown> | import("@cloudflare/workers-types").D1Result<unknown>>;
export declare function deleteRecord(db: D1Database, SQL: string, bindings: any[]): Promise<void>;
/**
 *
 * ## Setup
 *
 * This is the D1 Adapter for [`next-auth`](https://authjs.dev). This package can only be used in conjunction with the primary `next-auth` package. It is not a standalone package.
 *
 * ### Configure Auth.js
 *
 * ```javascript title="pages/api/auth/[...nextauth].js"
 * import NextAuth from "next-auth"
 * import { D1Adapter, up } from "@auth/d1-adapter"
 *
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/configuration/auth-options
 * export default NextAuth({
 *   // https://authjs.dev/reference/providers/
 *   providers: [],
 *   adapter: D1Adapter(env.db)
 *   ...
 * })
 * ```
 *
 * ### Migrations
 *
 * Somewhere in the initialization of your application you need to run the `up(env.db)` function to create the tables in D1.
 * It will create 4 tables if they don't already exist:
 * `accounts`, `sessions`, `users`, `verification_tokens`.
 *
 * The table prefix "" is not configurable at this time.
 *
 * You can use something like the following to attempt the migration once each time your worker starts up.  Running migrations more than once will not erase your existing tables.
 * ```javascript
 * import { up } from "@auth/d1-adapter"
 *
 * let migrated = false;
 * async function migrationHandle({event, resolve}) {
 *  if(!migrated) {
 *    try {
 *      await up(event.platform.env.db)
 *      migrated = true
 *    } catch(e) {
 *      console.log(e.cause.message, e.message)
 *    }
 *  }
 *  return resolve(event)
 * }
 * ```
 *
 *
 * You can also initialize your tables manually.  Look in [init.ts](https://github.com/nextauthjs/next-auth/packages/adapter-d1/src/migrations/init.ts) for the relevant sql.
 * Paste and run the SQL into your D1 dashboard query tool.
 *
 **/
export declare function D1Adapter(db: D1Database): Adapter;
//# sourceMappingURL=index.d.ts.map