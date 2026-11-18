/**
 * /api/projects
 *   GET  -> list my projects
 *   POST -> create a project from uploaded photos
 */
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getUsage } from "@/lib/usage";
import { DEFAULT_SETTINGS, VIEW_SLOTS } from "@/lib/settings";
import { createTask, isAiConfigured } from "@/lib/meshy";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));
  return NextResponse.json({ projects: list });
}

// zod checks that the request body has the shape we expect.
const CreateProject = z.object({
  name: z.string().trim().min(1).max(80),
  mode: z.enum(["photo", "ai"]),
  images: z.partialRecord(z.enum(VIEW_SLOTS), z.string().min(1)),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const parsed = CreateProject.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Some project details are missing." }, { status: 400 });
  }
  const { name, mode, images } = parsed.data;

  if (!images.front) {
    return NextResponse.json({ error: "Add at least a front photo." }, { status: 400 });
  }

  // ---- Check plan limits ----
  const usage = await getUsage(user);
  if (!usage.canCreateProject) {
    return NextResponse.json(
      { error: `Your ${usage.plan.name} plan allows ${usage.plan.maxProjects} products. Upgrade to add more.` },
      { status: 403 }
    );
  }

  if (mode === "photo") {
    const [project] = await db
      .insert(projects)
      .values({ userId: user.id, name, mode, images, settings: DEFAULT_SETTINGS })
      .returning();
    return NextResponse.json({ project });
  }

  // ---- AI mode ----
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI reconstruction is not set up on this server." }, { status: 503 });
  }
  if (!usage.canUseAi) {
    return NextResponse.json(
      { error: `You have used all AI reconstructions in your ${usage.plan.name} plan this month.` },
      { status: 403 }
    );
  }

  // Send the main four views first (the AI service accepts up to 4 photos).
  const ordered = (["front", "back", "left", "right", "top", "bottom"] as const)
    .map((slot) => images[slot])
    .filter((url): url is string => Boolean(url));

  try {
    const taskId = await createTask(ordered);
    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name,
        mode,
        images,
        // AI models already have their own colors, so start with photos "on".
        settings: { ...DEFAULT_SETTINGS, width: 1, height: 1, depth: 1 },
        status: "processing",
        progress: 0,
        aiTaskId: taskId,
      })
      .returning();
    return NextResponse.json({ project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The AI service could not start. Try again in a minute." }, { status: 502 });
  }
}
