/**
 * SUBSCRIPTION PLANS
 * One place to describe what each plan costs and allows.
 * The real prices live in Stripe; here we only link to them with Price IDs.
 */

export type PlanId = "free" | "pro" | "studio";

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // USD per month, for display only
  description: string;
  maxProjects: number; // Infinity = unlimited
  aiPerMonth: number; // AI 3D reconstructions per month
  canExportGlb: boolean; // download the 3D file
  features: string[];
  stripePriceId?: string; // set from environment variables
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    description: "Try it out with a few products.",
    maxProjects: 3,
    aiPerMonth: 0,
    canExportGlb: false,
    features: [
      "3 saved products",
      "Instant photo-to-3D models",
      "Change colors, finish and size",
      "Download PNG images",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9,
    description: "For online sellers and small shops.",
    maxProjects: Infinity,
    aiPerMonth: 15,
    canExportGlb: true,
    features: [
      "Unlimited saved products",
      "15 AI 3D reconstructions / month",
      "Download 3D files (.glb)",
      "Everything in Free",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 29,
    description: "For teams with large catalogs.",
    maxProjects: Infinity,
    aiPerMonth: 60,
    canExportGlb: true,
    features: [
      "Unlimited saved products",
      "60 AI 3D reconstructions / month",
      "Download 3D files (.glb)",
      "Everything in Pro",
    ],
    stripePriceId: process.env.STRIPE_PRICE_STUDIO,
  },
};

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

/** Find which plan a Stripe price belongs to. */
export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId && priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
  return "free";
}
