"use client";
/** Shows the three plans. Paid plan buttons open Stripe Checkout. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";

export function PricingTable({ signedIn, currentPlan }: { signedIn: boolean; currentPlan?: PlanId }) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  async function choose(plan: PlanId) {
    if (!signedIn) return router.push("/login?callbackUrl=/pricing");
    if (plan === "free") return router.push("/dashboard");
    setLoading(plan);
    setError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (json.url) window.location.assign(json.url); // go to Stripe's payment page
    else {
      setError(json.error ?? "Payments are not available right now.");
      setLoading(null);
    }
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const featured = plan.id === "pro";
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                featured ? "border-ink bg-ink text-white" : "border-line bg-card"
              }`}
            >
              <h3 className={`text-xl font-bold ${featured ? "text-white" : ""}`}>{plan.name}</h3>
              <p className={`mt-1 text-sm ${featured ? "text-white/70" : "text-muted"}`}>{plan.description}</p>
              <p className="mt-5">
                <span className={`font-display text-4xl font-bold ${featured ? "text-white" : "text-ink"}`}>
                  ${plan.price}
                </span>
                <span className={featured ? "text-white/70" : "text-muted"}> / month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-aqua" : "text-aqua-dark"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(plan.id)}
                disabled={isCurrent || loading !== null}
                className={`mt-6 ${featured ? "btn bg-aqua text-ink hover:bg-white" : "btn-ghost"}`}
              >
                {isCurrent
                  ? "Your current plan"
                  : loading === plan.id
                    ? "Opening checkout…"
                    : plan.id === "free"
                      ? "Start free"
                      : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </>
  );
}
