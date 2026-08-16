import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// The OS Lab app is fully client-side and does not require a database.
// The pool/db client below only powers the optional /api/health route.
// When DATABASE_URL is absent (e.g. static hosting), everything still works.

const databaseUrl = process.env.DATABASE_URL;

export const pool: Pool | null = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

export const db = pool ? drizzle(pool) : null;

export const hasDatabase = Boolean(databaseUrl);
