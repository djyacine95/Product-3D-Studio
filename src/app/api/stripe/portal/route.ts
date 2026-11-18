/**
 * POST /api/stripe/portal
 * Opens Stripe's Customer Portal, where users can change plan,
 * update their card or cancel. We don't need to build those screens!
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "You don't have a subscription yet." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/account`,
  });
  return NextResponse.json({ url: portal.url });
}
