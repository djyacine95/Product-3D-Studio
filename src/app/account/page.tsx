import Link from "next/link";
import { requireUser } from "@/lib/current-user";
import { getUsage } from "@/lib/usage";
import { ManageBillingButton } from "@/components/manage-billing-button";

export const metadata = { title: "Account — Turnable" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const usage = await getUsage(user);
  const { checkout } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Account</h1>

      {checkout === "success" && (
        <p className="mt-4 rounded-xl bg-aqua/15 px-4 py-3 text-sm font-medium text-ink">
          Payment received. Your plan updates within a few seconds; refresh this page if it hasn’t yet.
        </p>
      )}

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-bold">Profile</h2>
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Name</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted">Email</dt>
          <dd>{user.email}</dd>
        </dl>
      </section>

      <section className="panel mt-5 p-6">
        <h2 className="text-lg font-bold">Subscription</h2>
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Plan</dt>
          <dd className="font-semibold text-ink">{usage.plan.name}</dd>
          {user.subscriptionStatus && (
            <>
              <dt className="text-muted">Status</dt>
              <dd className="capitalize">{user.subscriptionStatus.replace("_", " ")}</dd>
            </>
          )}
          {user.currentPeriodEnd && (
            <>
              <dt className="text-muted">Renews on</dt>
              <dd>{user.currentPeriodEnd.toLocaleDateString()}</dd>
            </>
          )}
          <dt className="text-muted">AI builds</dt>
          <dd>
            {usage.aiThisMonth} of {usage.plan.aiPerMonth} used this month
          </dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {user.stripeCustomerId && <ManageBillingButton />}
          {usage.plan.id !== "studio" && (
            <Link href="/pricing" className="btn-primary">
              {usage.plan.id === "free" ? "Upgrade plan" : "Compare plans"}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
