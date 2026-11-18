/**
 * POST /api/stripe/checkout   body: { plan: "pro" | "studio" }
 * Creates a Stripe Checkout page and returns its URL.
 * The user pays on Stripe's secure page, then comes back to /account.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { plan } = (await request.json()) as { plan?: "pro" | "studio" };
  const priceId = plan ? PLANS[plan]?.stripePriceId : undefined;
  if (!priceId) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  const stripe = getStripe();

  // Each user gets one Stripe "customer". Create it the first time.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/pricing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
