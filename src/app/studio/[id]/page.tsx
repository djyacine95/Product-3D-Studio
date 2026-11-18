import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { getUsage } from "@/lib/usage";
import { withDefaults } from "@/lib/settings";
import { Editor } from "@/components/studio/editor";

export default async function StudioPage({ params }: PageProps<"/studio/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/studio/${id}`);

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  if (!project) notFound();

  const { plan } = await getUsage(user);

  return (
    <Editor
      project={{
        id: project.id,
        name: project.name,
        mode: project.mode as "photo" | "ai",
        images: project.images,
        settings: withDefaults(project.settings),
        status: project.status,
        progress: project.progress,
        modelUrl: project.modelUrl,
        errorMessage: project.errorMessage,
      }}
      canExportGlb={plan.canExportGlb}
    />
  );
}
