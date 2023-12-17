import type { D1Database } from ".";
export declare const upSQLStatements: string[];
export declare const down: string[];
/**
 *
 * @param db
 */
declare function up(db: D1Database): Promise<void>;
export { up };
//# sourceMappingURL=migrations.d.ts.map