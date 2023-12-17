/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>Official <a href="https://neo4j.com/docs/">Neo4j</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://neo4j.com/">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/neo4j.png" height="30"/>
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install @auth/neo4j-adapter neo4j-driver
 * ```
 *
 * @module @auth/neo4j-adapter
 */
import { type Session } from "neo4j-driver";
import type { Adapter } from "@auth/core/adapters";
/** This is the interface of the Neo4j adapter options. The Neo4j adapter takes a {@link https://neo4j.com/docs/bolt/current/driver-api/#driver-session Neo4j session} as its only argument. */
export interface Neo4jOptions extends Session {
}
/**
 * ## Setup
 *
 * Add this adapter to your `pages/api/[...nextauth].js` Auth.js configuration object.
 *
 * ```javascript title="pages/api/auth/[...nextauth].js"
 * import neo4j from "neo4j-driver"
 * import { Neo4jAdapter } from "@auth/neo4j-adapter"
 *
 * const driver = neo4j.driver(
 *   "bolt://localhost",
 *   neo4j.auth.basic("neo4j", "password")
 * )
 *
 * const neo4jSession = driver.session()
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/configuration/auth-options
 * export default NextAuth({
 *   // https://authjs.dev/reference/core/providers
 *   providers: [],
 *   adapter: Neo4jAdapter(neo4jSession),
 *   ...
 * })
 * ```
 * ## Advanced usage
 *
 * ### Schema
 *
 * #### Node labels
 *
 * The following node labels are used.
 *
 * - User
 * - Account
 * - Session
 * - VerificationToken
 *
 * #### Relationships
 *
 * The following relationships and relationship labels are used.
 *
 * - (:User)-[:HAS_ACCOUNT]->(:Account)
 * - (:User)-[:HAS_SESSION]->(:Session)
 *
 * #### Properties
 *
 * This schema is adapted for use in Neo4J and is based upon our main [models](https://authjs.dev/reference/core/adapters#models). Please check there for the node properties. Relationships have no properties.
 *
 * #### Indexes
 *
 * Optimum indexes will vary on your edition of Neo4j i.e. community or enterprise, and in case you have your own additional data on the nodes. Below are basic suggested indexes.
 *
 * 1. For **both** Community Edition & Enterprise Edition create constraints and indexes
 *
 * ```cypher
 *
 * CREATE CONSTRAINT user_id_constraint IF NOT EXISTS
 * ON (u:User) ASSERT u.id IS UNIQUE;
 *
 * CREATE INDEX user_id_index IF NOT EXISTS
 * FOR (u:User) ON (u.id);
 *
 * CREATE INDEX user_email_index IF NOT EXISTS
 * FOR (u:User) ON (u.email);
 *
 * CREATE CONSTRAINT session_session_token_constraint IF NOT EXISTS
 * ON (s:Session) ASSERT s.sessionToken IS UNIQUE;
 *
 * CREATE INDEX session_session_token_index IF NOT EXISTS
 * FOR (s:Session) ON (s.sessionToken);
 * ```
 *
 * 2.a. For Community Edition **only** create single-property indexes
 *
 * ```cypher
 * CREATE INDEX account_provider_index IF NOT EXISTS
 * FOR (a:Account) ON (a.provider);
 *
 * CREATE INDEX account_provider_account_id_index IF NOT EXISTS
 * FOR (a:Account) ON (a.providerAccountId);
 *
 * CREATE INDEX verification_token_identifier_index IF NOT EXISTS
 * FOR (v:VerificationToken) ON (v.identifier);
 *
 * CREATE INDEX verification_token_token_index IF NOT EXISTS
 * FOR (v:VerificationToken) ON (v.token);
 * ```
 *
 * 2.b. For Enterprise Edition **only** create composite node key constraints and indexes
 *
 * ```cypher
 * CREATE CONSTRAINT account_provider_composite_constraint IF NOT EXISTS
 * ON (a:Account) ASSERT (a.provider, a.providerAccountId) IS NODE KEY;
 *
 * CREATE INDEX account_provider_composite_index IF NOT EXISTS
 * FOR (a:Account) ON (a.provider, a.providerAccountId);
 *
 * CREATE CONSTRAINT verification_token_composite_constraint IF NOT EXISTS
 * ON (v:VerificationToken) ASSERT (v.identifier, v.token) IS NODE KEY;
 *
 * CREATE INDEX verification_token_composite_index IF NOT EXISTS
 * FOR (v:VerificationToken) ON (v.identifier, v.token);
 * ```
 */
export declare function Neo4jAdapter(session: Session): Adapter;
export declare const format: {
    /** Takes a plain old JavaScript object and turns it into a Neo4j compatible object */
    to(object: Record<string, any>): Record<string, unknown>;
    /** Takes a Neo4j object and returns a plain old JavaScript object */
    from<T = Record<string, unknown>>(object?: Record<string, any>): T | null;
};
//# sourceMappingURL=index.d.ts.map