/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>An official <a href="https://azure.microsoft.com/en-us/products/storage/tables">Azure Table Storage</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://azure.microsoft.com/en-us/products/storage/tables">
 *   <img style={{display: "block"}} src="/img/adapters/azure-tables.svg" width="48" />
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install next-auth @auth/azure-tables-adapter
 * ```
 *
 * @module @auth/azure-tables-adapter
 */
import type { Adapter } from "@auth/core/adapters";
import { GetTableEntityResponse, TableClient, TableEntityResult } from "@azure/data-tables";
export declare const keys: {
    user: string;
    userByEmail: string;
    account: string;
    accountByUserId: string;
    session: string;
    sessionByUserId: string;
    verificationToken: string;
};
export declare function withoutKeys<T>(entity: GetTableEntityResponse<TableEntityResult<T>>): T;
/**
 *
 * 1. Create a table for authentication data, `auth` in the example below.
 *
 * ```js title="auth.ts"
 * import type { AuthConfig } from "next-auth"
 * import { TableStorageAdapter } from "@next-auth/azure-tables-adapter"
 * import { AzureNamedKeyCredential, TableClient } from "@azure/data-tables"
 *
 * const credential = new AzureNamedKeyCredential(
 *   process.env.AZURE_ACCOUNT,
 *   process.env.AZURE_ACCESS_KEY
 * )
 * const authClient = new TableClient(
 *   process.env.AZURE_TABLES_ENDPOINT,
 *   "auth",
 *   credential
 * )
 *
 * // For more information on each option (and a full list of options) go to
 * // https://authjs.dev/reference/configuration/auth-options
 * export default const authConfig = {
 *   // https://authjs.dev/reference/core/providers
 *   providers: [
 *     // ...
 *   ],
 *   adapter: TableStorageAdapter(authClient),
 *   // ...
 * } satisfies AuthConfig
 * ```
 *
 * Environment variable are as follows:
 *
 * ```
 * AZURE_ACCOUNT=storageaccountname
 * AZURE_ACCESS_KEY=longRandomKey
 * AZURE_TABLES_ENDPOINT=https://$AZURE_ACCOUNT.table.core.windows.net
 * ```
 *
 */
export declare const TableStorageAdapter: (client: TableClient) => Adapter;
//# sourceMappingURL=index.d.ts.map