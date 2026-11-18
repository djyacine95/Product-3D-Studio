import { PricingTable } from "@/components/pricing-table";
import { getCurrentUser } from "@/lib/current-user";
import { activePlanId } from "@/lib/usage";
import type { PlanId } from "@/lib/plans";

export const metadata = { title: "Pricing — Turnable" };

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-4xl font-bold">Pick a plan</h1>
      <p className="mt-3 max-w-xl text-lg">
        Every plan includes the 3D editor. Paid plans add AI-built shapes and 3D file downloads. Cancel any time.
      </p>
      <div className="mt-10">
        <PricingTable signedIn={Boolean(user)} currentPlan={user ? (activePlanId(user) as PlanId) : undefined} />
      </div>
    </div>
  );
}
