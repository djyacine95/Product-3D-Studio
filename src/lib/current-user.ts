/**
 * Helpers to get the logged-in user on the server.
 */
import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/** Returns the full user row, or null if nobody is logged in. */
export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/** Same as above, but sends visitors to the login page. Use it in private pages. */
export async function requireUser(redirectTo = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  return user;
}
