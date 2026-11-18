/**
 * DATABASE TABLES
 * ---------------
 * Every `pgTable(...)` below becomes one table in PostgreSQL.
 * After you change this file, run:  npm run db:push
 */
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { ProductImages, EditorSettings } from "@/lib/settings";

// ---------- Users (+ their subscription) ----------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  // Subscription info, kept up to date by the Stripe webhook
  plan: text("plan").notNull().default("free"), // "free" | "pro" | "studio"
  stripeCustomerId: text("stripeCustomerId").unique(),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  stripePriceId: text("stripePriceId"),
  subscriptionStatus: text("subscriptionStatus"), // "active", "canceled"...
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),

  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// ---------- 3D projects ----------

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),

    // "photo" = model built in the browser from the photos (instant, free)
    // "ai"    = model reconstructed by an AI service (paid plans)
    mode: text("mode").notNull().default("photo"),

    images: jsonb("images").$type<ProductImages>().notNull(),
    settings: jsonb("settings").$type<EditorSettings>().notNull(),

    // Only used by AI projects
    status: text("status").notNull().default("ready"), // processing | ready | failed
    progress: integer("progress").notNull().default(100),
    aiTaskId: text("aiTaskId"),
    modelUrl: text("modelUrl"),
    thumbnailUrl: text("thumbnailUrl"),
    errorMessage: text("errorMessage"),

    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("project_user_idx").on(table.userId)]
);

// ---------- Tables required by Auth.js (Google login) ----------

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
