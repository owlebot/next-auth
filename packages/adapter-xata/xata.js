/**
 * This file is auto-generated from Xata and corresponds
 * to the database types in the Xata database. Please do not
 * augment by hand.
 */
import { buildClient, } from "@xata.io/client";
const tables = [
    "nextauth_users",
    "nextauth_accounts",
    "nextauth_verificationTokens",
    "nextauth_users_accounts",
    "nextauth_users_sessions",
    "nextauth_sessions",
];
const DatabaseClient = buildClient();
export class XataClient extends DatabaseClient {
    constructor(options) {
        super({ databaseURL: "", ...options }, tables);
    }
}
