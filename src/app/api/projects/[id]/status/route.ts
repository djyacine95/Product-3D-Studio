/**
 * GET /api/projects/:id/status
 * The editor calls this every few seconds while an AI model is being built.
 * When the AI is done, we copy the 3D file to our own storage (the AI
 * service's download links expire after a few days).
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { auth } from "@/auth";
import { getTask } from "@/lib/meshy";
import { saveFile, isBlobConfigured } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  // Nothing to check for photo projects or finished AI projects.
  if (project.status !== "processing" || !project.aiTaskId) {
    return NextResponse.json({ project });
  }

  try {
    const task = await getTask(project.aiTaskId);

    if (task.status === "SUCCEEDED" && task.model_urls?.glb) {
      let modelUrl = task.model_urls.glb;
      if (isBlobConfigured()) {
        const file = await fetch(modelUrl).then((r) => r.arrayBuffer());
        modelUrl = await saveFile(`models/${project.id}.glb`, file, "model/gltf-binary");
      }
      const [updated] = await db
        .update(projects)
        .set({ status: "ready", progress: 100, modelUrl, thumbnailUrl: task.thumbnail_url, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return NextResponse.json({ project: updated });
    }

    if (task.status === "FAILED" || task.status === "CANCELED") {
      const [updated] = await db
        .update(projects)
        .set({
          status: "failed",
          errorMessage: task.task_error?.message || "The AI could not build this model. Try clearer photos.",
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();
      return NextResponse.json({ project: updated });
    }

    // Still working: save the progress so the dashboard can show it.
    const [updated] = await db
      .update(projects)
      .set({ progress: task.progress ?? 0 })
      .where(eq(projects.id, id))
      .returning();
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ project }); // try again on the next poll
  }
}
