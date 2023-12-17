/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>An official <a href="https://www.postgresql.org/">PostgreSQL</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://www.postgresql.org/">
 *   <img style={{display: "block"}} src="/img/adapters/pg.png" width="48" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install next-auth @auth/pg-adapter pg
 * ```
 *
 * @module @auth/pg-adapter
 */
import type { Adapter } from "@auth/core/adapters";
import type { Pool } from "pg";
export declare function mapExpiresAt(account: any): any;
/**
 * ## Setup
 *
 * The SQL schema for the tables used by this adapter is as follows. Learn more about the models at our doc page on [Database Models](https://authjs.dev/getting-started/adapters#models).
 *
 * ```sql
 * CREATE TABLE verification_token
 * (
 *   identifier TEXT NOT NULL,
 *   expires TIMESTAMPTZ NOT NULL,
 *   token TEXT NOT NULL,
 *
 *   PRIMARY KEY (identifier, token)
 * );
 *
 * CREATE TABLE accounts
 * (
 *   id SERIAL,
 *   "userId" INTEGER NOT NULL,
 *   type VARCHAR(255) NOT NULL,
 *   provider VARCHAR(255) NOT NULL,
 *   "providerAccountId" VARCHAR(255) NOT NULL,
 *   refresh_token TEXT,
 *   access_token TEXT,
 *   expires_at BIGINT,
 *   id_token TEXT,
 *   scope TEXT,
 *   session_state TEXT,
 *   token_type TEXT,
 *
 *   PRIMARY KEY (id)
 * );
 *
 * CREATE TABLE sessions
 * (
 *   id SERIAL,
 *   "userId" INTEGER NOT NULL,
 *   expires TIMESTAMPTZ NOT NULL,
 *   "sessionToken" VARCHAR(255) NOT NULL,
 *
 *   PRIMARY KEY (id)
 * );
 *
 * CREATE TABLE users
 * (
 *   id SERIAL,
 *   name VARCHAR(255),
 *   email VARCHAR(255),
 *   "emailVerified" TIMESTAMPTZ,
 *   image TEXT,
 *
 *   PRIMARY KEY (id)
 * );
 *
 * ```
 *
 * ```typescript title="auth.ts"
 * import NextAuth from "next-auth"
 * import GoogleProvider from "next-auth/providers/google"
 * import PostgresAdapter from "@auth/pg-adapter"
 * import { Pool } from 'pg'
 *
 * const pool = new Pool({
 *   host: 'localhost',
 *   user: 'database-user',
 *   max: 20,
 *   idleTimeoutMillis: 30000,
 *   connectionTimeoutMillis: 2000,
 * })
 *
 * export default NextAuth({
 *   adapter: PostgresAdapter(pool),
 *   providers: [
 *     GoogleProvider({
 *       clientId: process.env.GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *     }),
 *   ],
 * })
 * ```
 *
 */
export default function PostgresAdapter(client: Pool): Adapter;
//# sourceMappingURL=index.d.ts.map