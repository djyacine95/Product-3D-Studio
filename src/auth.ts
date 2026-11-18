/**
 * LOGIN WITH GOOGLE (Auth.js / NextAuth v5)
 * -----------------------------------------
 * Auth.js reads these environment variables automatically:
 *   AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
 * The DrizzleAdapter saves users and sessions in our database.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    // Add the user id to the session so we can use it in our pages.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
