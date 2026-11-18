import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { getUsage } from "@/lib/usage";
import { isAiConfigured } from "@/lib/meshy";
import { NewProductForm } from "@/components/studio/new-product-form";

export const metadata = { title: "New product — Turnable" };

export default async function NewProductPage() {
  const user = await requireUser("/studio/new");
  const usage = await getUsage(user);
  if (!usage.canCreateProject) redirect("/pricing");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-bold">New product</h1>
      <p className="mt-2 max-w-2xl">
        Add a photo for each side. Shoot straight on, fill the frame with the product and use a plain background.
      </p>
      <NewProductForm
        aiAvailable={isAiConfigured() && usage.canUseAi}
        aiReason={
          !isAiConfigured()
            ? "AI building is not set up on this server yet."
            : usage.plan.aiPerMonth === 0
              ? "Available on Pro and Studio plans."
              : `You've used all ${usage.plan.aiPerMonth} AI builds this month.`
        }
      />
    </div>
  );
}
