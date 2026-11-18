/**
 * AI 3D RECONSTRUCTION (Meshy API)
 * --------------------------------
 * We send up to 4 photos of the product and Meshy builds a textured 3D model.
 * It takes a few minutes, so it works in two steps:
 *   1. createTask()  -> Meshy gives us a task id
 *   2. getTask(id)   -> we ask "is it done yet?" every few seconds
 * Docs: https://docs.meshy.ai/api/multi-image-to-3d
 */
import "server-only";

const BASE_URL = "https://api.meshy.ai/openapi/v1/multi-image-to-3d";

export const isAiConfigured = () => Boolean(process.env.MESHY_API_KEY);

export type MeshyTask = {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  progress: number;
  model_urls?: { glb?: string };
  thumbnail_url?: string;
  task_error?: { message?: string };
};

function headers() {
  return {
    Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Start a new reconstruction. `imageUrls` = 1 to 4 public URLs or data URLs. */
export async function createTask(imageUrls: string[]): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      image_urls: imageUrls.slice(0, 4), // Meshy accepts at most 4 photos
      should_texture: true,
      enable_pbr: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`The AI service refused the request (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { result: string };
  return json.result;
}

/** Ask Meshy for the current state of a task. */
export async function getTask(taskId: string): Promise<MeshyTask> {
  const res = await fetch(`${BASE_URL}/${taskId}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Could not read the AI task (${res.status})`);
  return (await res.json()) as MeshyTask;
}
