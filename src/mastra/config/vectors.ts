import { PgVector } from "@mastra/pg";

// PostgreSQL ベクターストアを中央で設定
export const postgresVector = new PgVector({
  connectionString: process.env.PG_CONNECTION_STRING || "postgresql://postgres:password@localhost:5432/mastra_vectors",
});

// ベクターストアへの直接アクセス関数（循環依存を回避）
export function getPostgresVector() {
  return postgresVector;
}