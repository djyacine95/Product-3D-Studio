/**
 * STRIPE (payments and subscriptions)
 * Only used on the server. Never send STRIPE_SECRET_KEY to the browser!
 */
import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing. Add it to your .env.local file.");
  }
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
