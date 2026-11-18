/**
 * /api/projects/:id
 *   PATCH  -> save the name and editor settings
 *   DELETE -> delete the project
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { auth } from "@/auth";
import { withDefaults } from "@/lib/settings";

type Context = { params: Promise<{ id: string }> };

const UpdateProject = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  settings: z
    .object({
      shape: z.enum(["box", "cylinder"]),
      width: z.number().min(0.1).max(5),
      height: z.number().min(0.1).max(5),
      depth: z.number().min(0.05).max(5),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      showPhotos: z.boolean(),
      finish: z.enum(["matte", "satin", "glossy", "metallic", "glass"]),
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      lighting: z.enum(["studio", "city", "apartment", "park"]),
      autoRotate: z.boolean(),
      wireframe: z.boolean(),
    })
    .partial()
    .optional(),
});

export async function PATCH(request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateProject.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });

  // Only the owner can change a project: we filter by id AND userId.
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const [project] = await db
    .update(projects)
    .set({
      name: parsed.data.name ?? existing.name,
      settings: withDefaults({ ...existing.settings, ...parsed.data.settings }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { id } = await params;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
