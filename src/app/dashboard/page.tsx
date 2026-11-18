import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, Sparkles, Box } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { getUsage } from "@/lib/usage";

export const metadata = { title: "My products — Turnable" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const usage = await getUsage(user);
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  const limit = usage.plan.maxProjects === Infinity ? "unlimited" : usage.plan.maxProjects;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My products</h1>
          <p className="mt-1 text-sm text-muted">
            {usage.plan.name} plan, {usage.projectCount} of {limit} products
            {usage.plan.aiPerMonth > 0 && `, ${usage.aiThisMonth} of ${usage.plan.aiPerMonth} AI builds this month`}
          </p>
        </div>
        {usage.canCreateProject ? (
          <Link href="/studio/new" className="btn-primary">
            <Plus className="size-4" /> New product
          </Link>
        ) : (
          <Link href="/pricing" className="btn-primary">
            Upgrade to add more products
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="panel mt-10 flex flex-col items-center px-6 py-16 text-center">
          <Box className="size-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold">No products yet</h2>
          <p className="mt-1 max-w-sm">Upload four photos of something you sell and see it in 3D in a few seconds.</p>
          <Link href="/studio/new" className="btn-primary mt-6">
            Create your first product
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const preview = p.thumbnailUrl ?? p.images.front;
            return (
              <li key={p.id}>
                <Link href={`/studio/${p.id}`} className="panel group block overflow-hidden hover:border-primary">
                  <div className="aspect-[4/3] bg-lilac">
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div>
                      <p className="font-semibold text-ink group-hover:text-primary">{p.name}</p>
                      <p className="text-xs text-muted">Edited {p.updatedAt.toLocaleDateString()}</p>
                    </div>
                    {p.mode === "ai" && (
                      <span className="flex items-center gap-1 rounded-full bg-lilac px-2.5 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="size-3" />
                        {p.status === "processing" ? `Building ${p.progress}%` : p.status === "failed" ? "Failed" : "AI"}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
