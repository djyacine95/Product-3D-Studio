/**
 * POST /api/upload
 * Receives one photo (form field "file") and returns its URL.
 * The browser already shrinks photos before sending them (see lib/image.ts).
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveFile } from "@/lib/storage";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is larger than 4 MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const url = await saveFile(`photos/${session.user.id}/photo.${ext}`, file, file.type);
  return NextResponse.json({ url });
}
