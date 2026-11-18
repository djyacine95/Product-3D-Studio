/**
 * DATABASE CONNECTION
 * One shared connection used by the whole app.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "";

// In development, Next.js reloads files often. We keep the connection on
// `globalThis` so we don't open a new one on every reload.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false, // needed for pooled connections (Neon, Supabase...)
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
