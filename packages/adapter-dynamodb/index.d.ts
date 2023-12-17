/**
 * <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16}}>
 *  <p style={{fontWeight: "normal"}}>Official <a href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html">DynamoDB</a> adapter for Auth.js / NextAuth.js.</p>
 *  <a href="https://docs.aws.amazon.com/dynamodb/index.html">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/adapters/dynamodb.png" width="48"/>
 *  </a>
 * </div>
 *
 * ## Installation
 *
 * ```bash npm2yarn
 * npm install next-auth @auth/dynamodb-adapter
 * ```
 *
 * @module @auth/dynamodb-adapter
 */
import type { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import type { Adapter } from "@auth/core/adapters";
export interface DynamoDBAdapterOptions {
    tableName?: string;
    partitionKey?: string;
    sortKey?: string;
    indexName?: string;
    indexPartitionKey?: string;
    indexSortKey?: string;
}
/**
 * ## Setup
 *
 * By default, the adapter expects a table with a partition key `pk` and a sort key `sk`, as well as a global secondary index named `GSI1` with `GSI1PK` as partition key and `GSI1SK` as sorting key. To automatically delete sessions and verification requests after they expire using [dynamodb TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html) you should [enable the TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-how-to.html) with attribute name 'expires'. You can set whatever you want as the table name and the billing method.
 * You can find the full schema in the table structure section below.
 *
 * ### Configuring Auth.js
 *
 * You need to pass `DynamoDBDocument` client from the modular [`aws-sdk`](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-dynamodb-utilities.html) v3 to the adapter.
 * The default table name is `next-auth`, but you can customise that by passing `{ tableName: 'your-table-name' }` as the second parameter in the adapter.
 *
 * ```javascript title="pages/api/auth/[...nextauth].js"
 * import { DynamoDB, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
 * import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"
 * import NextAuth from "next-auth";
 * import Providers from "next-auth/providers";
 * import { DynamoDBAdapter } from "@auth/dynamodb-adapter"
 *
 * const config: DynamoDBClientConfig = {
 *   credentials: {
 *     accessKeyId: process.env.NEXT_AUTH_AWS_ACCESS_KEY,
 *     secretAccessKey: process.env.NEXT_AUTH_AWS_SECRET_KEY,
 *   },
 *   region: process.env.NEXT_AUTH_AWS_REGION,
 * };
 *
 * const client = DynamoDBDocument.from(new DynamoDB(config), {
 *   marshallOptions: {
 *     convertEmptyValues: true,
 *     removeUndefinedValues: true,
 *     convertClassInstanceToMap: true,
 *   },
 * })
 *
 * export default NextAuth({
 *   // Configure one or more authentication providers
 *   providers: [
 *     Providers.GitHub({
 *       clientId: process.env.GITHUB_ID,
 *       clientSecret: process.env.GITHUB_SECRET,
 *     }),
 *     Providers.Email({
 *       server: process.env.EMAIL_SERVER,
 *       from: process.env.EMAIL_FROM,
 *     }),
 *     // ...add more providers here
 *   ],
 *   adapter: DynamoDBAdapter(
 *     client
 *   ),
 *   ...
 * });
 * ```
 *
 * (AWS secrets start with `NEXT_AUTH_` in order to not conflict with [Vercel's reserved environment variables](https://vercel.com/docs/environment-variables#reserved-environment-variables).)
 *
 * ## Advanced usage
 *
 * ### Default schema
 *
 * The table respects the single table design pattern. This has many advantages:
 *
 * - Only one table to manage, monitor and provision.
 * - Querying relations is faster than with multi-table schemas (for eg. retrieving all sessions for a user).
 * - Only one table needs to be replicated if you want to go multi-region.
 *
 * > This schema is adapted for use in DynamoDB and based upon our main [schema](https://authjs.dev/reference/core/adapters#models)
 *
 * ![DynamoDB Table](https://i.imgur.com/hGZtWDq.png)
 *
 * You can create this table with infrastructure as code using [`aws-cdk`](https://github.com/aws/aws-cdk) with the following table definition:
 *
 * ```javascript title=stack.ts
 * new dynamodb.Table(this, `NextAuthTable`, {
 *   tableName: "next-auth",
 *   partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
 *   sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
 *   timeToLiveAttribute: "expires",
 * }).addGlobalSecondaryIndex({
 *   indexName: "GSI1",
 *   partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
 *   sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
 * })
 * ```
 *
 * Alternatively, you can use this cloudformation template:
 *
 * ```yaml title=cloudformation.yaml
 * NextAuthTable:
 *   Type: "AWS::DynamoDB::Table"
 *   Properties:
 *     TableName: next-auth
 *     AttributeDefinitions:
 *       - AttributeName: pk
 *         AttributeType: S
 *       - AttributeName: sk
 *         AttributeType: S
 *       - AttributeName: GSI1PK
 *         AttributeType: S
 *       - AttributeName: GSI1SK
 *         AttributeType: S
 *     KeySchema:
 *       - AttributeName: pk
 *         KeyType: HASH
 *       - AttributeName: sk
 *         KeyType: RANGE
 *     GlobalSecondaryIndexes:
 *       - IndexName: GSI1
 *         Projection:
 *           ProjectionType: ALL
 *         KeySchema:
 *           - AttributeName: GSI1PK
 *             KeyType: HASH
 *           - AttributeName: GSI1SK
 *             KeyType: RANGE
 *     TimeToLiveSpecification:
 *       AttributeName: expires
 *       Enabled: true
 * ```
 *
 * ### Using a custom schema
 *
 * You can configure your custom table schema by passing the `options` key to the adapter constructor:
 *
 * ```javascript
 * const adapter = DynamoDBAdapter(client, {
 *   tableName: "custom-table-name",
 *   partitionKey: "custom-pk",
 *   sortKey: "custom-sk",
 *   indexName: "custom-index-name",
 *   indexPartitionKey: "custom-index-pk",
 *   indexSortKey: "custom-index-sk",
 * })
 * ```
 **/
export declare function DynamoDBAdapter(client: DynamoDBDocument, options?: DynamoDBAdapterOptions): Adapter;
declare const format: {
    /** Takes a plain old JavaScript object and turns it into a Dynamodb object */
    to(object: Record<string, any>): Record<string, unknown>;
    /** Takes a Dynamo object and returns a plain old JavaScript object */
    from<T = Record<string, unknown>>(object?: Record<string, any>): T | null;
};
declare function generateUpdateExpression(object: Record<string, any>): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
};
export { format, generateUpdateExpression };
//# sourceMappingURL=index.d.ts.map