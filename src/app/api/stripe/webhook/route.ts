/**
 * POST /api/stripe/webhook
 * --------------------------------------------------------------
 * Stripe calls this URL when something happens to a subscription
 * (paid, renewed, changed, canceled). We update the user's plan here.
 *
 * Why a webhook? The browser could lie ("I paid!"), but Stripe signs every
 * webhook with STRIPE_WEBHOOK_SECRET, so we can trust it.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import { planFromPriceId } from "@/lib/plans";

async function saveSubscription(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const ended = subscription.status === "canceled" || subscription.status === "incomplete_expired";

  await db
    .update(users)
    .set({
      plan: ended ? "free" : planFromPriceId(item?.price.id),
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id ?? null,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    })
    .where(eq(users.stripeCustomerId, customerId));
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text(); // raw body is needed to check the signature
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await saveSubscription(await stripe.subscriptions.retrieve(id));
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await saveSubscription(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
