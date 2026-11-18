// Drizzle Kit configuration.
// It tells Drizzle where our tables are described and which database to use.
// Run `npm run db:push` to create/update the tables in your database.
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
