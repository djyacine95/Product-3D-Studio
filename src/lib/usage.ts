/**
 * PLAN LIMITS
 * Checks what the current user is allowed to do on their plan.
 */
import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { projects, type User } from "@/db/schema";
import { getPlan } from "./plans";

/** A user keeps paid features only while Stripe says the subscription is active. */
export function activePlanId(user: User) {
  const paying = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
  return paying ? user.plan : "free";
}

export async function getUsage(user: User) {
  const plan = getPlan(activePlanId(user));

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .where(eq(projects.userId, user.id));

  const [{ aiThisMonth }] = await db
    .select({ aiThisMonth: count() })
    .from(projects)
    .where(
      and(
        eq(projects.userId, user.id),
        eq(projects.mode, "ai"),
        gte(projects.createdAt, startOfMonth)
      )
    );

  return {
    plan,
    projectCount: total,
    aiThisMonth,
    canCreateProject: total < plan.maxProjects,
    canUseAi: aiThisMonth < plan.aiPerMonth,
  };
}
