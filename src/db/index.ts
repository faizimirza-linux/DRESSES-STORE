import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Netlify Database exposes NETLIFY_DB_URL at runtime. Keep DATABASE_URL
// for local development and compatibility with other Postgres providers.
const databaseUrl = process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or NETLIFY_DB_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
